import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { ProductEntity } from '../db/entities';

@Injectable()
export class CatalogService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async listProducts(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async getProduct(tenantId: string, productId: string) {
    const repo = await this.repo(tenantId);
    const product = await repo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(
    tenantId: string,
    payload: { title: string; description?: string; price: number; currency?: string },
  ) {
    const repo = await this.repo(tenantId);
    const product = repo.create({
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price,
      currency: payload.currency || 'USD',
    });
    return repo.save(product);
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    payload: { title?: string; description?: string; price?: number; currency?: string },
  ) {
    const repo = await this.repo(tenantId);
    const product = await repo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    if (payload.title !== undefined) product.title = payload.title;
    if (payload.description !== undefined) product.description = payload.description ?? null;
    if (payload.price !== undefined) product.price = payload.price;
    if (payload.currency !== undefined) product.currency = payload.currency;

    return repo.save(product);
  }

  async deleteProduct(tenantId: string, productId: string) {
    const repo = await this.repo(tenantId);
    const product = await repo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    await repo.remove(product);
    return { deleted: true, id: productId };
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(ProductEntity);
  }
}
