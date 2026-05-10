import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  applicationDb,
  runnerDb,
  TaskStatus,
  TaskType,
  WebsiteStatus,
} from 'bizpark.core';
import { AuditService } from '../common/audit.service';

@Injectable()
export class WebsitesService {
  constructor(
    @InjectQueue('agent-queue') private readonly agentQueue: Queue,
    private readonly audit: AuditService,
  ) {}

  list() {
    return applicationDb.website.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async detail(id: string) {
    const website = await applicationDb.website.findUnique({ where: { id } });
    if (!website) {
      throw new NotFoundException('Website not found');
    }
    return website;
  }

  async publish(id: string, adminId?: string) {
    const website = await this.detail(id);
    const content = (website.cmsData ?? {}) as Record<string, unknown>;
    await this.syncCommerce(website.businessId, { ...content, isPublished: true });
    const updated = await applicationDb.website.update({
      where: { id },
      data: {
        status: WebsiteStatus.PUBLISHED,
        publishedAt: new Date(),
        suspendedAt: null,
      },
    });
    await this.audit.record({
      adminId,
      action: 'website.publish',
      targetType: 'website',
      targetId: id,
      beforeData: { status: website.status },
      afterData: { status: updated.status },
    });
    return updated;
  }

  async unpublish(id: string, adminId?: string) {
    const website = await this.detail(id);
    await this.syncCommerce(website.businessId, { isPublished: false });
    const updated = await applicationDb.website.update({
      where: { id },
      data: { status: WebsiteStatus.UNPUBLISHED },
    });
    await this.audit.record({
      adminId,
      action: 'website.unpublish',
      targetType: 'website',
      targetId: id,
      beforeData: { status: website.status },
      afterData: { status: updated.status },
    });
    return updated;
  }

  async suspend(id: string, adminId?: string) {
    const website = await this.detail(id);
    await this.syncCommerce(website.businessId, { isPublished: false });
    const updated = await applicationDb.website.update({
      where: { id },
      data: { status: WebsiteStatus.SUSPENDED, suspendedAt: new Date() },
    });
    await this.audit.record({
      adminId,
      action: 'website.suspend',
      targetType: 'website',
      targetId: id,
      beforeData: { status: website.status },
      afterData: { status: updated.status },
    });
    return updated;
  }

  async redeploy(id: string, adminId?: string) {
    const website = await this.detail(id);
    const business = website.business;
    const taskId = randomUUID();
    const inputData = {
      business: {
        id: business.id,
        name: business.name,
        category: business.category,
        description: business.description,
        logoUrl: business.logoUrl,
      },
      websiteConfig: {
        templateId: website.templateId,
        cmsData: website.cmsData || {},
      },
      tone: 'professional',
    };

    await runnerDb.agentTask.create({
      data: {
        id: taskId,
        businessId: website.businessId,
        taskType: TaskType.WEBSITE_GENERATION,
        status: TaskStatus.QUEUED,
        inputData,
      },
    });
    await this.agentQueue.add('agent-job', {
      taskId,
      businessId: website.businessId,
      taskType: TaskType.WEBSITE_GENERATION,
      inputData,
    });
    const updated = await applicationDb.website.update({
      where: { id },
      data: { status: WebsiteStatus.GENERATING },
    });
    await this.audit.record({
      adminId,
      action: 'website.redeploy',
      targetType: 'website',
      targetId: id,
      beforeData: { status: website.status },
      afterData: { status: updated.status, taskId },
    });
    return { website: updated, taskId };
  }

  private async syncCommerce(businessId: string, payload: Record<string, unknown>) {
    const commerceUrl = process.env.COMMERCE_URL || 'http://localhost:3003';
    const internalKey = process.env.INTERNAL_API_KEY || '';
    try {
      await fetch(`${commerceUrl}/api/commerce/website-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': businessId,
          'x-internal-key': internalKey,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Commerce can be offline in local development; the database state still records intent.
    }
  }
}
