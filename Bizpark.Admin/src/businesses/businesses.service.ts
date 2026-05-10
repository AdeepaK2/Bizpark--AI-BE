import { Injectable, NotFoundException } from '@nestjs/common';
import {
  applicationDb,
  BusinessStatus,
  SubscriptionStatus,
  SubscriptionTier,
} from 'bizpark.core';
import { AuditService } from '../common/audit.service';

@Injectable()
export class BusinessesService {
  constructor(private readonly audit: AuditService) {}

  list() {
    return applicationDb.business.findForAdmin({ orderBy: { createdAt: 'desc' } });
  }

  async detail(id: string) {
    const business = await applicationDb.business.findUniqueForAdmin({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async updateStatus(id: string, status: BusinessStatus, adminId?: string) {
    const before = await this.detail(id);
    const updated = await applicationDb.business.update({ where: { id }, data: { status } });
    await this.audit.record({
      adminId,
      action: 'business.status.update',
      targetType: 'business',
      targetId: id,
      beforeData: { status: before.status },
      afterData: { status: updated.status },
    });
    return updated;
  }

  async updateSubscription(
    id: string,
    input: { tier: SubscriptionTier; status: SubscriptionStatus; expiresAt?: string },
    adminId?: string,
  ) {
    const before = await applicationDb.subscription.findLatestForBusiness({ businessId: id });
    await applicationDb.business.update({
      where: { id },
      data: { subscriptionTier: input.tier },
    });
    const subscription = await applicationDb.subscription.upsertForBusiness({
      businessId: id,
      data: {
        tier: input.tier,
        status: input.status,
        startedAt: before?.startedAt ?? new Date(),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    await this.audit.record({
      adminId,
      action: 'business.subscription.update',
      targetType: 'business',
      targetId: id,
      beforeData: before as unknown as Record<string, unknown> | null,
      afterData: subscription as unknown as Record<string, unknown>,
    });
    return subscription;
  }
}
