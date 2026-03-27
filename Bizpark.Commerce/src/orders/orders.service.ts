import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { InventoryService } from '../inventory/inventory.service';
import { OrderEntity, OrderItemEntity, OrderStatus } from '../db/entities';

type OrderItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice?: number;
  unitTitle?: string;
};

type ShippingAddress = {
  name: string; line1: string; line2?: string;
  city: string; state?: string; postalCode: string; country: string;
};

// Valid status transitions: from → allowed nexts
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'CANCELLED'],
  FULFILLED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly tenantDb: TenantDataSourceFactory,
    private readonly inventoryService: InventoryService,
  ) {}

  async list(tenantId: string, page = 1, limit = 20) {
    const repo = await this.repo(tenantId);
    const [data, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listByCustomer(tenantId: string, customerId: string, page = 1, limit = 20) {
    const repo = await this.repo(tenantId);
    const [data, total] = await repo.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, orderId: string) {
    const repo = await this.repo(tenantId);
    const order = await repo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(tenantId: string, payload: { customerId: string; items: OrderItemInput[]; shippingAddress?: ShippingAddress | null }) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const orderRepo = ds.getRepository(OrderEntity);
    const itemRepo = ds.getRepository(OrderItemEntity);

    // Reserve inventory for each item (non-transactional path — direct order creation)
    for (const item of payload.items) {
      const result = await this.inventoryService.reserveByProductId(tenantId, item.productId, item.quantity);
      if (!result.success) {
        throw new BadRequestException(result.message || `Insufficient stock for product ${item.productId}`);
      }
    }

    const totalAmount = payload.items.reduce((sum, i) => {
      return sum + Number(i.unitPrice ?? 0) * i.quantity;
    }, 0);

    const addr = payload.shippingAddress ?? null;
    const order = await orderRepo.save(
      orderRepo.create({
        customerId: payload.customerId,
        status: 'PENDING',
        totalAmount,
        items: [],
        shippingName: addr?.name ?? null,
        shippingLine1: addr?.line1 ?? null,
        shippingLine2: addr?.line2 ?? null,
        shippingCity: addr?.city ?? null,
        shippingState: addr?.state ?? null,
        shippingPostalCode: addr?.postalCode ?? null,
        shippingCountry: addr?.country ?? null,
      }),
    );

    const items = payload.items.map((i) =>
      itemRepo.create({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice ?? 0),
        unitTitle: i.unitTitle ?? '',
        subtotal: Number(i.unitPrice ?? 0) * i.quantity,
        order,
      }),
    );
    await itemRepo.save(items);

    return orderRepo.findOne({ where: { id: order.id } });
  }

  async updateStatus(tenantId: string, orderId: string, status: OrderStatus) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const repo = ds.getRepository(OrderEntity);
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use QueryBuilder with pessimistic lock — avoids the eager OneToMany join
      // that would trigger the "FOR UPDATE cannot be applied to outer join" error.
      const order = await queryRunner.manager
        .createQueryBuilder(OrderEntity, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: orderId })
        .getOne();
      if (!order) throw new NotFoundException('Order not found');

      const allowed = TRANSITIONS[order.status];
      if (!allowed.includes(status)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
        );
      }

      // Release reserved inventory when order is cancelled (load items separately)
      if (status === 'CANCELLED') {
        const orderWithItems = await queryRunner.manager.findOne(OrderEntity, { where: { id: orderId } });
        if (orderWithItems?.items?.length) {
          for (const item of orderWithItems.items) {
            await this.inventoryService.releaseWithLock(
              queryRunner.manager,
              item.productId,
              item.quantity,
              item.variantId,
            );
          }
        }
      }

      order.status = status;
      await queryRunner.manager.save(OrderEntity, order);
      await queryRunner.commitTransaction();

      return repo.findOne({ where: { id: orderId } });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Customer-initiated cancel — only PENDING orders, releases inventory. */
  async cancelByCustomer(tenantId: string, orderId: string, customerId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const repo = ds.getRepository(OrderEntity);
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager
        .createQueryBuilder(OrderEntity, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: orderId })
        .getOne();
      if (!order) throw new NotFoundException('Order not found');
      if (order.customerId !== customerId) throw new NotFoundException('Order not found');
      if (order.status !== 'PENDING') {
        throw new BadRequestException(`Only PENDING orders can be cancelled. Current status: ${order.status}`);
      }

      // Release reserved inventory
      const orderWithItems = await queryRunner.manager.findOne(OrderEntity, { where: { id: orderId } });
      if (orderWithItems?.items?.length) {
        for (const item of orderWithItems.items) {
          await this.inventoryService.releaseWithLock(queryRunner.manager, item.productId, item.quantity, item.variantId);
        }
      }

      order.status = 'CANCELLED';
      await queryRunner.manager.save(OrderEntity, order);
      await queryRunner.commitTransaction();

      return repo.findOne({ where: { id: orderId } });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(OrderEntity);
  }
}
