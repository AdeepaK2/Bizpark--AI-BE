import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type Customer = {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  createdAt: string;
};

@Injectable()
export class CustomersService {
  private readonly customersByTenant = new Map<string, Customer[]>();

  list(tenantId: string) {
    return this.customersByTenant.get(tenantId) || [];
  }

  create(tenantId: string, payload: { email: string; name?: string }) {
    const customer: Customer = {
      id: randomUUID(),
      tenantId,
      email: payload.email.trim().toLowerCase(),
      name: payload.name,
      createdAt: new Date().toISOString(),
    };

    const existing = this.customersByTenant.get(tenantId) || [];
    this.customersByTenant.set(tenantId, [customer, ...existing]);

    return customer;
  }
}
