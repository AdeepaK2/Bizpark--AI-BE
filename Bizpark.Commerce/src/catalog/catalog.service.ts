import { Injectable } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { ProductEntity } from '../db/entities';

@Injectable()
export class CatalogService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async listProducts(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
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

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(ProductEntity);
  }
}
