import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { ShippingService } from './shipping.service';

@Controller('api/commerce/shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // Public — list available shipping methods
  @Get('methods')
  async listMethods(@TenantId() tenantId: string) {
    return { success: true, data: await this.shippingService.listMethods(tenantId) };
  }

  // ADMIN only — create shipping methods
  @Post('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createMethod(
    @TenantId() tenantId: string,
    @Body() dto: { code: string; label: string; flatRate: number; currency?: string; active?: boolean },
  ) {
    return { success: true, data: await this.shippingService.createMethod(tenantId, dto) };
  }

  // Public — get shipping quote
  @Post('quote')
  quote(
    @TenantId() tenantId: string,
    @Body() dto: { methodCode: string; weightKg?: number; orderSubtotal?: number },
  ) {
    return this.shippingService.quote(tenantId, dto);
  }
}
