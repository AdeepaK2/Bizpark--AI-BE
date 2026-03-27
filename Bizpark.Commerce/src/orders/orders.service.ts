import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { InventoryService } from '../inventory/inventory.service';
import { OrderEntity, OrderItemEntity, OrderStatus } from '../db/entities';

type OrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice?: number;
  unitTitle?: string;
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

  async list(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async listByCustomer(tenantId: string, customerId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async getById(tenantId: string, orderId: string) {
    const repo = await this.repo(tenantId);
    const order = await repo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(tenantId: string, payload: { customerId: string; items: OrderItemInput[] }) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const orderRepo = ds.getRepository(OrderEntity);
    const itemRepo = ds.getRepository(OrderItemEntity);

    const totalAmount = payload.items.reduce((sum, i) => {
      const price = Number(i.unitPrice ?? 0);
      return sum + price * i.quantity;
    }, 0);

    const order = await orderRepo.save(
      orderRepo.create({ customerId: payload.customerId, status: 'PENDING', totalAmount, items: [] }),
    );

    const items = payload.items.map((i) =>
      itemRepo.create({
        productId: i.productId,
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
    const repo = await this.repo(tenantId);
    const order = await repo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = TRANSITIONS[order.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${status}. Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
      );
    }

    // Release reserved inventory when order is cancelled
    if (status === 'CANCELLED' && order.items && order.items.length > 0) {
      for (const item of order.items) {
        await this.inventoryService.releaseByProductId(tenantId, item.productId, item.quantity);
      }
    }

    order.status = status;
    return repo.save(order);
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(OrderEntity);
  }
}
