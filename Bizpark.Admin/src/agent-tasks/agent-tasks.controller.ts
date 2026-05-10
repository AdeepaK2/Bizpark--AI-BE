import { Controller, Get, Param, Post, Redirect, Render, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../common/admin-request';
import { AgentTasksService } from './agent-tasks.service';

@Controller('admin/agent-tasks')
@UseGuards(AdminAuthGuard)
export class AgentTasksController {
  constructor(private readonly tasksService: AgentTasksService) {}

  @Get()
  @Render('agent-tasks/index')
  async index(@Req() request: AdminRequest) {
    return {
      title: 'Agent Tasks',
      admin: request.adminUser,
      tasks: await this.tasksService.list(),
    };
  }

  @Get(':id')
  @Render('agent-tasks/detail')
  async detail(@Param('id') id: string, @Req() request: AdminRequest) {
    return {
      title: 'Agent Task Detail',
      admin: request.adminUser,
      task: await this.tasksService.detail(id),
    };
  }

  @Post(':id/approve')
  @Redirect()
  async approve(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.tasksService.approve(id, request.adminUser?.id);
    return { url: `/admin/agent-tasks/${id}` };
  }

  @Post(':id/reject')
  @Redirect()
  async reject(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.tasksService.reject(id, request.adminUser?.id);
    return { url: `/admin/agent-tasks/${id}` };
  }

  @Post(':id/retry')
  @Redirect()
  async retry(@Param('id') id: string, @Req() request: AdminRequest) {
    const retryTaskId = await this.tasksService.retry(id, request.adminUser?.id);
    return { url: `/admin/agent-tasks/${retryTaskId}` };
  }
}
