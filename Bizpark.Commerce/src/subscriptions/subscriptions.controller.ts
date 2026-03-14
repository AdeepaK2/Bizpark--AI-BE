import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Controller('api/commerce/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return {
      success: true,
      data: this.subscriptionsService.list(tenantId),
    };
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() dto: { customerId: string; planCode: string },
  ) {
    return {
      success: true,
      data: this.subscriptionsService.create(tenantId, dto),
    };
  }
}
