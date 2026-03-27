import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  async beginCheckout(tenantId: string, payload: { customerId: string }) {
    const cart = await this.cartService.getCart(tenantId, payload.customerId);

    return {
      checkoutId: randomUUID(),
      tenantId,
      customerId: payload.customerId,
      cart,
      status: 'READY_FOR_PAYMENT',
      createdAt: new Date().toISOString(),
    };
  }

  async completeCheckout(tenantId: string, payload: { customerId: string }) {
    const cart = await this.cartService.getCart(tenantId, payload.customerId);
    const order = this.ordersService.create(tenantId, {
      customerId: payload.customerId,
      items: cart.items,
    });

    this.cartService.clearCart(tenantId, payload.customerId);

    return {
      success: true,
      order,
    };
  }
}
