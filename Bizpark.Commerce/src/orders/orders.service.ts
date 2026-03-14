import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type OrderItem = {
  productId: string;
  quantity: number;
};

type Order = {
  id: string;
  tenantId: string;
  customerId: string;
  status: 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED';
  items: OrderItem[];
  createdAt: string;
};

@Injectable()
export class OrdersService {
  private readonly ordersByTenant = new Map<string, Order[]>();

  list(tenantId: string) {
    return this.ordersByTenant.get(tenantId) || [];
  }

  create(tenantId: string, payload: { customerId: string; items: OrderItem[] }) {
    const order: Order = {
      id: randomUUID(),
      tenantId,
      customerId: payload.customerId,
      status: 'PENDING',
      items: payload.items,
      createdAt: new Date().toISOString(),
    };

    const existing = this.ordersByTenant.get(tenantId) || [];
    this.ordersByTenant.set(tenantId, [order, ...existing]);

    return order;
  }
}
