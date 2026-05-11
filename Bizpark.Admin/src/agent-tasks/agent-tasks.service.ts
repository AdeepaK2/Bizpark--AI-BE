import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { applicationDb, runnerDb, TaskStatus, TaskType, WebsiteStatus } from 'bizpark.core';
import { AuditService } from '../common/audit.service';

@Injectable()
export class AgentTasksService {
  constructor(
    @InjectQueue('agent-queue') private readonly agentQueue: Queue,
    private readonly audit: AuditService,
  ) {}

  list() {
    return runnerDb.agentTask.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async detail(id: string) {
    const task = await runnerDb.agentTask.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async approve(id: string, adminId?: string) {
    const task = await this.detail(id);
    const output = task.outputData as Record<string, unknown> | null;
    const content = (output?.generatedContent ?? output?.approvedContent ?? {}) as Record<string, unknown>;
    if (!Object.keys(content).length) {
      throw new NotFoundException('Task has no generated content to approve');
    }

    await this.syncCommerce(task.businessId, { ...content, isPublished: true });
    const updatedTask = await runnerDb.agentTask.update({
      where: { id },
      data: { status: TaskStatus.COMPLETED, outputData: { approvedContent: content } },
    });
    const website = await applicationDb.website.findFirstByBusinessId({ businessId: task.businessId });
    if (website) {
      await applicationDb.website.update({
        where: { id: website.id },
        data: {
          cmsData: content,
          status: WebsiteStatus.PUBLISHED,
          publishedAt: new Date(),
          suspendedAt: null,
        },
      });
    }
    await this.audit.record({
      adminId,
      action: 'agent-task.approve',
      targetType: 'agent-task',
      targetId: id,
      beforeData: { status: task.status },
      afterData: { status: updatedTask.status },
    });
    return updatedTask;
  }

  async reject(id: string, adminId?: string) {
    const task = await this.detail(id);
    const updatedTask = await runnerDb.agentTask.update({
      where: { id },
      data: { status: TaskStatus.FAILED, outputData: { reason: 'Rejected by admin' } },
    });
    const website = await applicationDb.website.findFirstByBusinessId({ businessId: task.businessId });
    if (website) {
      await applicationDb.website.update({
        where: { id: website.id },
        data: { status: WebsiteStatus.FAILED },
      });
    }
    await this.audit.record({
      adminId,
      action: 'agent-task.reject',
      targetType: 'agent-task',
      targetId: id,
      beforeData: { status: task.status },
      afterData: { status: updatedTask.status },
    });
    return updatedTask;
  }

  async retry(id: string, adminId?: string) {
    const task = await this.detail(id);
    const taskId = randomUUID();
    await runnerDb.agentTask.create({
      data: {
        id: taskId,
        businessId: task.businessId,
        taskType: task.taskType,
        status: TaskStatus.QUEUED,
        inputData: task.inputData,
      },
    });
    await this.agentQueue.add('agent-job', {
      taskId,
      businessId: task.businessId,
      taskType: task.taskType,
      inputData: task.inputData,
    });
    const website = await applicationDb.website.findFirstByBusinessId({ businessId: task.businessId });
    if (website && task.taskType === TaskType.WEBSITE_GENERATION) {
      await applicationDb.website.update({
        where: { id: website.id },
        data: { status: WebsiteStatus.GENERATING },
      });
    }
    await this.audit.record({
      adminId,
      action: 'agent-task.retry',
      targetType: 'agent-task',
      targetId: id,
      afterData: { retryTaskId: taskId },
    });
    return taskId;
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
      // Keep admin action successful if Commerce is offline in local development.
    }
  }
}
