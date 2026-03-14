import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type CatalogProduct = {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  createdAt: string;
};

@Injectable()
export class CatalogService {
  private readonly productsByTenant = new Map<string, CatalogProduct[]>();

  listProducts(tenantId: string) {
    return this.productsByTenant.get(tenantId) || [];
  }

  createProduct(
    tenantId: string,
    payload: { title: string; description?: string; price: number; currency?: string },
  ) {
    const product: CatalogProduct = {
      id: randomUUID(),
      tenantId,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      currency: payload.currency || 'USD',
      createdAt: new Date().toISOString(),
    };

    const existing = this.productsByTenant.get(tenantId) || [];
    this.productsByTenant.set(tenantId, [product, ...existing]);

    return product;
  }
}
