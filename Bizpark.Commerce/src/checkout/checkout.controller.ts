import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { CheckoutService } from './checkout.service';
import { CheckoutBeginDto, CheckoutCompleteDto } from '../cart/dtos';

@ApiTags('Checkout')
@ApiSecurity('TenantId')
@ApiBearerAuth('JWT')
@Controller('api/commerce/checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @ApiOperation({ summary: 'Begin checkout', description: 'Validates cart and prepares checkout session.' })
  @ApiResponse({ status: 201, description: 'Checkout session data' })
  @Post('begin')
  async beginCheckout(@TenantId() tenantId: string, @Body() dto: CheckoutBeginDto) {
    return { success: true, data: await this.checkoutService.beginCheckout(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Complete checkout', description: 'Creates the order from cart and clears cart.' })
  @ApiResponse({ status: 201, description: 'Returns created order object' })
  @Post('complete')
  async completeCheckout(@TenantId() tenantId: string, @Body() dto: CheckoutCompleteDto) {
    return this.checkoutService.completeCheckout(tenantId, dto);
  }
}
