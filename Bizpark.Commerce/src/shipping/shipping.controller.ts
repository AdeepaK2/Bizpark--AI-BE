import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { ShippingService } from './shipping.service';

@Controller('api/commerce/shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('methods')
  listMethods(@TenantId() tenantId: string) {
    return {
      success: true,
      data: this.shippingService.listMethods(tenantId),
    };
  }

  @Post('methods')
  @UseGuards(JwtAuthGuard)
  createMethod(
    @TenantId() tenantId: string,
    @Body()
    dto: {
      code: string;
      label: string;
      flatRate: number;
      currency?: string;
      active?: boolean;
    },
  ) {
    return {
      success: true,
      data: this.shippingService.createMethod(tenantId, dto),
    };
  }

  @Post('quote')
  quote(
    @TenantId() tenantId: string,
    @Body() dto: { methodCode: string; weightKg?: number; orderSubtotal?: number },
  ) {
    return this.shippingService.quote(tenantId, dto);
  }
}
