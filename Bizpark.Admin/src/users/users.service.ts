import { Injectable, NotFoundException } from '@nestjs/common';
import { applicationDb } from 'bizpark.core';
import { AuditService } from '../common/audit.service';

@Injectable()
export class UsersService {
  constructor(private readonly audit: AuditService) {}

  list() {
    return applicationDb.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async detail(id: string) {
    const user = await applicationDb.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const users = await applicationDb.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.find((candidate) => candidate.id === id) ?? user;
  }

  async updateStatus(id: string, isActive: boolean, adminId?: string) {
    const before = await this.detail(id);
    const updated = await applicationDb.user.update({ where: { id }, data: { isActive } });
    await this.audit.record({
      adminId,
      action: 'user.status.update',
      targetType: 'user',
      targetId: id,
      beforeData: { isActive: before.isActive },
      afterData: { isActive: updated.isActive },
    });
    return updated;
  }
}
