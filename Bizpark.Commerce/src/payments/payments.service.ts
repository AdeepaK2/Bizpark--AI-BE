import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly ordersService: OrdersService) {}

  createPaymentIntent(
    tenantId: string,
    payload: { customerId: string; orderId?: string; amount: number; currency?: string },
  ) {
    const intentId = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return {
      id: intentId,
      tenantId,
      customerId: payload.customerId,
      orderId: payload.orderId ?? null,
      amount: payload.amount,
      currency: payload.currency || 'USD',
      status: 'REQUIRES_CONFIRMATION',
      provider: 'STRIPE',
      createdAt: new Date().toISOString(),
    };
  }

  async processWebhook(tenantId: string, event: unknown) {
    const evt = event as Record<string, unknown>;

    // Handle Stripe payment_intent.succeeded → mark linked order as PAID
    if (evt['type'] === 'payment_intent.succeeded') {
      const obj = evt['data'] as Record<string, unknown> | undefined;
      const paymentObject = obj?.['object'] as Record<string, unknown> | undefined;
      const metadata = paymentObject?.['metadata'] as Record<string, string> | undefined;
      const orderId = metadata?.['orderId'];

      if (orderId && tenantId) {
        try {
          await this.ordersService.updateStatus(tenantId, orderId, 'PAID');
        } catch {
          // Order may not exist or already in terminal state — log but don't fail webhook
        }
      }
    }

    return {
      accepted: true,
      receivedAt: new Date().toISOString(),
      event,
    };
  }
}
