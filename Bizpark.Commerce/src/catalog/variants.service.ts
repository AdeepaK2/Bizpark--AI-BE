import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { ProductVariantEntity } from '../db/entities';

@Injectable()
export class VariantsService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string, productId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ where: { productId }, order: { createdAt: 'ASC' } });
  }

  async getById(tenantId: string, variantId: string) {
    const repo = await this.repo(tenantId);
    const variant = await repo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  async create(
    tenantId: string,
    productId: string,
    payload: { title: string; sku: string; price?: number | null; attributes?: Record<string, string>; isActive?: boolean },
  ) {
    const repo = await this.repo(tenantId);
    const variant = repo.create({
      productId,
      title: payload.title,
      sku: payload.sku,
      price: payload.price ?? null,
      attributes: payload.attributes ?? null,
      isActive: payload.isActive ?? true,
    });
    return repo.save(variant);
  }

  async update(
    tenantId: string,
    variantId: string,
    payload: { title?: string; sku?: string; price?: number | null; attributes?: Record<string, string>; isActive?: boolean },
  ) {
    const repo = await this.repo(tenantId);
    const variant = await repo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    if (payload.title !== undefined) variant.title = payload.title;
    if (payload.sku !== undefined) variant.sku = payload.sku;
    if (payload.price !== undefined) variant.price = payload.price ?? null;
    if (payload.attributes !== undefined) variant.attributes = payload.attributes ?? null;
    if (payload.isActive !== undefined) variant.isActive = payload.isActive;

    return repo.save(variant);
  }

  async delete(tenantId: string, variantId: string) {
    const repo = await this.repo(tenantId);
    const variant = await repo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    await repo.remove(variant);
    return { deleted: true, id: variantId };
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(ProductVariantEntity);
  }
}
