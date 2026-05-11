import { Body, Controller, Get, Param, Post, Redirect, Render, Req, UseGuards } from '@nestjs/common';
import { BusinessStatus, SubscriptionStatus, SubscriptionTier } from 'bizpark.core';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../common/admin-request';
import { BusinessesService } from './businesses.service';

@Controller('admin/businesses')
@UseGuards(AdminAuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @Render('businesses/index')
  async index(@Req() request: AdminRequest) {
    return {
      title: 'Businesses',
      admin: request.adminUser,
      businesses: await this.businessesService.list(),
      statuses: Object.values(BusinessStatus),
    };
  }

  @Get(':id')
  @Render('businesses/detail')
  async detail(@Param('id') id: string, @Req() request: AdminRequest) {
    return {
      title: 'Business Detail',
      admin: request.adminUser,
      business: await this.businessesService.detail(id),
      businessStatuses: Object.values(BusinessStatus),
      subscriptionTiers: Object.values(SubscriptionTier),
      subscriptionStatuses: Object.values(SubscriptionStatus),
    };
  }

  @Post(':id/status')
  @Redirect()
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BusinessStatus,
    @Req() request: AdminRequest,
  ) {
    await this.businessesService.updateStatus(id, status, request.adminUser?.id);
    return { url: `/admin/businesses/${id}` };
  }

  @Post(':id/subscription')
  @Redirect()
  async updateSubscription(
    @Param('id') id: string,
    @Body() body: { tier: SubscriptionTier; status: SubscriptionStatus; expiresAt?: string },
    @Req() request: AdminRequest,
  ) {
    await this.businessesService.updateSubscription(id, body, request.adminUser?.id);
    return { url: `/admin/businesses/${id}` };
  }
}
