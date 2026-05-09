import { Injectable } from '@nestjs/common';
import { adminDb } from 'bizpark.core';

@Injectable()
export class AuditLogsService {
  list() {
    return adminDb.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
