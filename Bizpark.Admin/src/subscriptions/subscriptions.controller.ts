import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../common/admin-request';
import { SubscriptionsService } from './subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(AdminAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @Render('subscriptions/index')
  async index(@Req() request: AdminRequest) {
    return {
      title: 'Subscriptions',
      admin: request.adminUser,
      subscriptions: await this.subscriptionsService.list(),
    };
  }
}
