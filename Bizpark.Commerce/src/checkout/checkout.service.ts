import { BadRequestException, Injectable } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
    private readonly inventoryService: InventoryService,
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

    // Reserve inventory for every item before creating the order
    for (const item of cart.items) {
      const result = await this.inventoryService.reserveByProductId(tenantId, item.productId, item.quantity);
      if (!result.success) {
        throw new BadRequestException(result.message || `Insufficient stock for product ${item.productId}`);
      }
    }

    // Pass price + title snapshots from cart items so order records are accurate
    const order = await this.ordersService.create(tenantId, {
      customerId: payload.customerId,
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice ?? 0),
        unitTitle: i.unitTitle ?? '',
      })),
    });

    await this.cartService.clearCart(tenantId, payload.customerId);

    return { success: true, order };
  }
}
