import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { CheckoutService } from './checkout.service';

@Controller('api/commerce/checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('begin')
  async beginCheckout(@TenantId() tenantId: string, @Body() dto: { customerId: string }) {
    return { success: true, data: await this.checkoutService.beginCheckout(tenantId, dto) };
  }

  @Post('complete')
  completeCheckout(@TenantId() tenantId: string, @Body() dto: { customerId: string }) {
    return this.checkoutService.completeCheckout(tenantId, dto);
  }
}
