import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { InventoryItemEntity } from '../db/entities';

@Injectable()
export class InventoryService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async getByProductId(tenantId: string, productId: string) {
    const repo = await this.repo(tenantId);
    const item = await repo.findOne({ where: { productId } });
    if (!item) throw new NotFoundException('Inventory item not found for this product');
    return item;
  }

  async upsert(
    tenantId: string,
    payload: { productId: string; sku: string; availableQuantity: number; reservedQuantity?: number },
  ) {
    const repo = await this.repo(tenantId);
    const existing = await repo.findOne({ where: { sku: payload.sku } });

    if (existing) {
      existing.productId = payload.productId;
      existing.availableQuantity = Math.max(0, Number(payload.availableQuantity || 0));
      if (payload.reservedQuantity !== undefined) {
        existing.reservedQuantity = Math.max(0, Number(payload.reservedQuantity));
      }
      return repo.save(existing);
    }

    const created = repo.create({
      productId: payload.productId,
      sku: payload.sku,
      availableQuantity: Math.max(0, Number(payload.availableQuantity || 0)),
      reservedQuantity: Math.max(0, Number(payload.reservedQuantity || 0)),
    });
    return repo.save(created);
  }

  async reserve(tenantId: string, payload: { sku: string; quantity: number }) {
    const repo = await this.repo(tenantId);
    const item = await repo.findOne({ where: { sku: payload.sku } });

    if (!item) return { success: false, message: 'Inventory SKU not found' };

    const quantity = Math.max(1, Number(payload.quantity || 1));
    if (item.availableQuantity < quantity) {
      return { success: false, message: 'Insufficient inventory', data: item };
    }

    item.availableQuantity -= quantity;
    item.reservedQuantity += quantity;
    const saved = await repo.save(item);
    return { success: true, data: saved };
  }

  /**
   * Reserve inventory by productId (used by checkout).
   * Returns { success, message? } so callers can decide whether to abort.
   */
  async reserveByProductId(tenantId: string, productId: string, quantity: number): Promise<{ success: boolean; message?: string }> {
    const repo = await this.repo(tenantId);
    const item = await repo.findOne({ where: { productId } });

    if (!item) {
      // No inventory record = untracked product, allow checkout
      return { success: true };
    }

    const qty = Math.max(1, Number(quantity));
    if (item.availableQuantity < qty) {
      return { success: false, message: `Insufficient stock for product ${productId}` };
    }

    item.availableQuantity -= qty;
    item.reservedQuantity += qty;
    await repo.save(item);
    return { success: true };
  }

  /**
   * Release reserved inventory back to available (used when order is CANCELLED).
   */
  async releaseByProductId(tenantId: string, productId: string, quantity: number): Promise<void> {
    const repo = await this.repo(tenantId);
    const item = await repo.findOne({ where: { productId } });
    if (!item) return;

    const qty = Math.max(1, Number(quantity));
    item.reservedQuantity = Math.max(0, item.reservedQuantity - qty);
    item.availableQuantity += qty;
    await repo.save(item);
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(InventoryItemEntity);
  }
}
