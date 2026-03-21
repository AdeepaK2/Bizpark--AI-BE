import { Injectable } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { CustomerEntity } from '../db/entities';

@Injectable()
export class CustomersService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(tenantId: string, payload: { email: string; name?: string }) {
    const repo = await this.repo(tenantId);
    const customer = repo.create({
      email: payload.email.trim().toLowerCase(),
      name: payload.name ?? null,
    });
    return repo.save(customer);
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(CustomerEntity);
  }
}
