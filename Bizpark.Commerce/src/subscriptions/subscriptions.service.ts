import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { SubscriptionEntity, SubscriptionStatus } from '../db/entities';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async listByCustomer(tenantId: string, customerId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async create(tenantId: string, payload: { customerId: string; planCode: string }) {
    const repo = await this.repo(tenantId);
    const subscription = repo.create({
      customerId: payload.customerId,
      planCode: payload.planCode,
      status: 'ACTIVE',
      startedAt: new Date(),
    });
    return repo.save(subscription);
  }

  async cancel(tenantId: string, subscriptionId: string) {
    const repo = await this.repo(tenantId);
    const sub = await repo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    sub.status = 'CANCELLED';
    return repo.save(sub);
  }

  async updateStatus(tenantId: string, subscriptionId: string, status: SubscriptionStatus) {
    const repo = await this.repo(tenantId);
    const sub = await repo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    sub.status = status;
    return repo.save(sub);
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(SubscriptionEntity);
  }
}
