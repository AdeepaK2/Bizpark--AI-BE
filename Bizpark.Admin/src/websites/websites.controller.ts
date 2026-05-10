import { Controller, Get, Param, Post, Redirect, Render, Req, UseGuards } from '@nestjs/common';
import { WebsiteStatus } from 'bizpark.core';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../common/admin-request';
import { WebsitesService } from './websites.service';

@Controller('admin/websites')
@UseGuards(AdminAuthGuard)
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get()
  @Render('websites/index')
  async index(@Req() request: AdminRequest) {
    return {
      title: 'Websites',
      admin: request.adminUser,
      websites: await this.websitesService.list(),
      statuses: Object.values(WebsiteStatus),
    };
  }

  @Get(':id')
  @Render('websites/detail')
  async detail(@Param('id') id: string, @Req() request: AdminRequest) {
    return {
      title: 'Website Detail',
      admin: request.adminUser,
      website: await this.websitesService.detail(id),
    };
  }

  @Post(':id/publish')
  @Redirect()
  async publish(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.websitesService.publish(id, request.adminUser?.id);
    return { url: `/admin/websites/${id}` };
  }

  @Post(':id/unpublish')
  @Redirect()
  async unpublish(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.websitesService.unpublish(id, request.adminUser?.id);
    return { url: `/admin/websites/${id}` };
  }

  @Post(':id/suspend')
  @Redirect()
  async suspend(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.websitesService.suspend(id, request.adminUser?.id);
    return { url: `/admin/websites/${id}` };
  }

  @Post(':id/redeploy')
  @Redirect()
  async redeploy(@Param('id') id: string, @Req() request: AdminRequest) {
    await this.websitesService.redeploy(id, request.adminUser?.id);
    return { url: `/admin/websites/${id}` };
  }
}
