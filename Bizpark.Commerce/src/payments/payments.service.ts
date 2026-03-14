import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  createPaymentIntent(tenantId: string, payload: { customerId: string; amount: number; currency?: string }) {
    return {
      id: randomUUID(),
      tenantId,
      customerId: payload.customerId,
      amount: payload.amount,
      currency: payload.currency || 'USD',
      status: 'REQUIRES_CONFIRMATION',
      provider: 'STRIPE',
      createdAt: new Date().toISOString(),
    };
  }

  processWebhook(event: unknown) {
    return {
      accepted: true,
      receivedAt: new Date().toISOString(),
      event,
    };
  }
}
