import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { SubscriptionEntity, SubscriptionStatus } from '../db/entities';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string, page = 1, limit = 20) {
    const repo = await this.repo(tenantId);
    const [data, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listByCustomer(tenantId: string, customerId: string, page = 1, limit = 20) {
    const repo = await this.repo(tenantId);
    const [data, total] = await repo.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, subscriptionId: string) {
    const repo = await this.repo(tenantId);
    const sub = await repo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async create(
    tenantId: string,
    payload: { customerId: string; planCode: string; billingInterval?: string; expiresAt?: string },
  ) {
    const repo = await this.repo(tenantId);

    const startedAt = new Date();
    let expiresAt: Date | null = null;
    let renewsAt: Date | null = null;

    if (payload.expiresAt) {
      expiresAt = new Date(payload.expiresAt);
      renewsAt = new Date(payload.expiresAt);
    } else if (payload.billingInterval) {
      expiresAt = calcExpiry(startedAt, payload.billingInterval);
      renewsAt = expiresAt ? new Date(expiresAt) : null;
    }

    const subscription = repo.create({
      customerId: payload.customerId,
      planCode: payload.planCode,
      billingInterval: payload.billingInterval ?? null,
      status: 'ACTIVE',
      startedAt,
      expiresAt,
      renewsAt,
    });
    return repo.save(subscription);
  }

  async cancel(tenantId: string, subscriptionId: string) {
    const repo = await this.repo(tenantId);
    const sub = await repo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    sub.status = 'CANCELLED';
    sub.renewsAt = null;
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

function calcExpiry(from: Date, interval: string): Date | null {
  const d = new Date(from);
  switch (interval.toLowerCase()) {
    case 'weekly':   d.setDate(d.getDate() + 7); break;
    case 'monthly':  d.setMonth(d.getMonth() + 1); break;
    case 'yearly':   d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d;
}
