import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../common/admin-request';
import { AuditLogsService } from './audit-logs.service';

@Controller('admin/audit-logs')
@UseGuards(AdminAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Render('audit-logs/index')
  async index(@Req() request: AdminRequest) {
    return {
      title: 'Audit Logs',
      admin: request.adminUser,
      logs: await this.auditLogsService.list(),
    };
  }
}
