import { BadRequestException, Injectable } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { CartEntity, CartItemEntity, OrderEntity, OrderItemEntity } from '../db/entities';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly tenantDb: TenantDataSourceFactory,
  ) {}

  async beginCheckout(tenantId: string, payload: { customerId: string }) {
    const cart = await this.cartService.getCart(tenantId, payload.customerId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty — add items before checkout');
    }

    return {
      checkoutId: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      customerId: payload.customerId,
      cart,
      status: 'READY_FOR_PAYMENT',
      createdAt: new Date().toISOString(),
    };
  }

  async completeCheckout(tenantId: string, payload: { customerId: string }) {
    const cart = await this.cartService.getCart(tenantId, payload.customerId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty — nothing to checkout');
    }

    const ds = await this.tenantDb.getDataSource(tenantId);
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Reserve inventory with pessimistic lock (prevents race conditions)
      for (const item of cart.items) {
        const result = await this.inventoryService.reserveWithLock(
          queryRunner.manager,
          item.productId,
          item.quantity,
          item.variantId,
        );
        if (!result.success) {
          throw new BadRequestException(result.message || `Insufficient stock for product ${item.productId}`);
        }
      }

      // 2. Calculate total
      const totalAmount = cart.items.reduce((sum, i) => sum + Number(i.unitPrice ?? 0) * i.quantity, 0);

      // 3. Create order
      const orderRepo = queryRunner.manager.getRepository(OrderEntity);
      const itemRepo = queryRunner.manager.getRepository(OrderItemEntity);

      const order = await orderRepo.save(
        orderRepo.create({ customerId: payload.customerId, status: 'PENDING', totalAmount, items: [] }),
      );

      // 4. Create order items
      const orderItems = cart.items.map((i) =>
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
      await itemRepo.save(orderItems);

      // 5. Clear cart
      const cartRepo = queryRunner.manager.getRepository(CartEntity);
      const cartItemRepo = queryRunner.manager.getRepository(CartItemEntity);
      const freshCart = await cartRepo.findOne({ where: { customerId: payload.customerId } });
      if (freshCart && freshCart.items.length > 0) {
        await cartItemRepo.remove(freshCart.items);
      }

      await queryRunner.commitTransaction();

      const savedOrder = await ds.getRepository(OrderEntity).findOne({ where: { id: order.id } });
      return { success: true, order: savedOrder };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
