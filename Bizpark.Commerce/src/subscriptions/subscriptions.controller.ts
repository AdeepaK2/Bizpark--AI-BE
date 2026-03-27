import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dtos';

type JwtUser = { id: string; tenantId: string; email: string; role: string };

@Controller('api/commerce/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ADMIN → all; CUSTOMER → own only
  @Get()
  async list(@TenantId() tenantId: string, @CurrentUser() user: JwtUser) {
    if (user.role === 'ADMIN') {
      return { success: true, data: await this.subscriptionsService.list(tenantId) };
    }
    return { success: true, data: await this.subscriptionsService.listByCustomer(tenantId, user.id) };
  }

  // ADMIN → any; CUSTOMER → own only
  @Get(':id')
  async getOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const sub = await this.subscriptionsService.getById(tenantId, id);
    if (user.role !== 'ADMIN' && sub.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    return { success: true, data: sub };
  }

  // Any authenticated user can subscribe
  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return { success: true, data: await this.subscriptionsService.create(tenantId, dto) };
  }

  // Customer cancels their own subscription; ADMIN can cancel any
  @Patch(':id/cancel')
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const sub = await this.subscriptionsService.getById(tenantId, id);
    if (user.role !== 'ADMIN' && sub.customerId !== user.id) {
      throw new ForbiddenException('Access denied: not your subscription');
    }
    return { success: true, data: await this.subscriptionsService.cancel(tenantId, id) };
  }

  // ADMIN only — force status change (e.g. mark PAST_DUE)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionStatusDto,
  ) {
    return { success: true, data: await this.subscriptionsService.updateStatus(tenantId, id, dto.status) };
  }
}
