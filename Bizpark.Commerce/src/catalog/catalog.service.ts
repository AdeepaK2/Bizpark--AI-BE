import { Injectable, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { ProductEntity } from '../db/entities';

@Injectable()
export class CatalogService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async listProducts(
    tenantId: string,
    opts: { categoryId?: string; page?: number; limit?: number } = {},
  ) {
    const repo = await this.repo(tenantId);
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));

    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (opts.categoryId) where['categoryId'] = opts.categoryId;

    const [data, total] = await repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProduct(tenantId: string, productId: string) {
    const repo = await this.repo(tenantId);
    const product = await repo.findOne({ where: { id: productId, deletedAt: IsNull() } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(
    tenantId: string,
    payload: { title: string; description?: string; price: number; currency?: string; categoryId?: string },
  ) {
    const repo = await this.repo(tenantId);
    const product = repo.create({
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price,
      currency: payload.currency || 'USD',
      categoryId: payload.categoryId ?? null,
    });
    return repo.save(product);
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    payload: { title?: string; description?: string; price?: number; currency?: string; categoryId?: string | null },
  ) {
    const repo = await this.repo(tenantId);
    const product = await repo.findOne({ where: { id: productId, deletedAt: IsNull() } });
    if (!product) throw new NotFoundException('Product not found');

    if (payload.title !== undefined) product.title = payload.title;
    if (payload.description !== undefined) product.description = payload.description ?? null;
    if (payload.price !== undefined) product.price = payload.price;
    if (payload.currency !== undefined) product.currency = payload.currency;
    if (payload.categoryId !== undefined) product.categoryId = payload.categoryId ?? null;

    return repo.save(product);
  }

  /** Soft delete — sets deletedAt timestamp, row stays in DB for order history */
  async deleteProduct(tenantId: string, productId: string) {
    const repo = await this.repo(tenantId);
    const product = await repo.findOne({ where: { id: productId, deletedAt: IsNull() } });
    if (!product) throw new NotFoundException('Product not found');
    await repo.softDelete(productId);
    return { deleted: true, id: productId };
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(ProductEntity);
  }
}
