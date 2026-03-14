import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type InventoryItem = {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  updatedAt: string;
};

@Injectable()
export class InventoryService {
  private readonly itemsByTenant = new Map<string, InventoryItem[]>();

  list(tenantId: string) {
    return this.itemsByTenant.get(tenantId) || [];
  }

  upsert(
    tenantId: string,
    payload: { productId: string; sku: string; availableQuantity: number; reservedQuantity?: number },
  ) {
    const items = this.itemsByTenant.get(tenantId) || [];
    const existing = items.find((item) => item.sku === payload.sku);

    if (existing) {
      existing.productId = payload.productId;
      existing.availableQuantity = Math.max(0, Number(payload.availableQuantity || 0));
      existing.reservedQuantity = Math.max(0, Number(payload.reservedQuantity || existing.reservedQuantity || 0));
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const created: InventoryItem = {
      id: randomUUID(),
      tenantId,
      productId: payload.productId,
      sku: payload.sku,
      availableQuantity: Math.max(0, Number(payload.availableQuantity || 0)),
      reservedQuantity: Math.max(0, Number(payload.reservedQuantity || 0)),
      updatedAt: new Date().toISOString(),
    };

    this.itemsByTenant.set(tenantId, [created, ...items]);
    return created;
  }

  reserve(tenantId: string, payload: { sku: string; quantity: number }) {
    const items = this.itemsByTenant.get(tenantId) || [];
    const item = items.find((candidate) => candidate.sku === payload.sku);

    if (!item) {
      return { success: false, message: 'Inventory SKU not found' };
    }

    const quantity = Math.max(1, Number(payload.quantity || 1));
    if (item.availableQuantity < quantity) {
      return {
        success: false,
        message: 'Insufficient inventory',
        data: item,
      };
    }

    item.availableQuantity -= quantity;
    item.reservedQuantity += quantity;
    item.updatedAt = new Date().toISOString();

    return {
      success: true,
      data: item,
    };
  }
}
