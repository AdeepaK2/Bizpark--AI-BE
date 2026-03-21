import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type Subscription = {
  id: string;
  tenantId: string;
  customerId: string;
  planCode: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  startedAt: string;
};

@Injectable()
export class SubscriptionsService {
  private readonly subscriptionsByTenant = new Map<string, Subscription[]>();

  list(tenantId: string) {
    return this.subscriptionsByTenant.get(tenantId) || [];
  }

  create(tenantId: string, payload: { customerId: string; planCode: string }) {
    const subscription: Subscription = {
      id: randomUUID(),
      tenantId,
      customerId: payload.customerId,
      planCode: payload.planCode,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
    };

    const existing = this.subscriptionsByTenant.get(tenantId) || [];
    this.subscriptionsByTenant.set(tenantId, [subscription, ...existing]);

    return subscription;
  }
}
