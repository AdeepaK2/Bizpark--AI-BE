import { Injectable } from '@nestjs/common';
import { applicationDb, BusinessStatus, runnerDb, SubscriptionStatus, TaskStatus, WebsiteStatus } from 'bizpark.core';

@Injectable()
export class DashboardService {
  async getStats() {
    const [
      businesses,
      users,
      websites,
      activeBusinesses,
      suspendedBusinesses,
      publishedWebsites,
      pendingWebsites,
      activeSubscriptions,
      pendingTasks,
      failedTasks,
    ] = await Promise.all([
      applicationDb.business.count(),
      applicationDb.user.count(),
      applicationDb.website.count(),
      applicationDb.business.count({ where: { status: BusinessStatus.ACTIVE } }),
      applicationDb.business.count({ where: { status: BusinessStatus.SUSPENDED } }),
      applicationDb.website.count({ where: { status: WebsiteStatus.PUBLISHED } }),
      applicationDb.website.count({ where: { status: WebsiteStatus.PENDING_APPROVAL } }),
      applicationDb.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      runnerDb.agentTask.count({ where: { status: TaskStatus.PENDING_APPROVAL } }),
      runnerDb.agentTask.count({ where: { status: TaskStatus.FAILED } }),
    ]);

    return {
      businesses,
      users,
      websites,
      activeBusinesses,
      suspendedBusinesses,
      publishedWebsites,
      pendingWebsites,
      activeSubscriptions,
      pendingTasks,
      failedTasks,
    };
  }

  async getRecent() {
    const [businesses, websites, tasks] = await Promise.all([
      applicationDb.business.findForAdmin({ orderBy: { createdAt: 'desc' } }),
      applicationDb.website.findMany({ orderBy: { createdAt: 'desc' } }),
      runnerDb.agentTask.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      businesses: businesses.slice(0, 6),
      websites: websites.slice(0, 6),
      tasks: tasks.slice(0, 6),
    };
  }
}
