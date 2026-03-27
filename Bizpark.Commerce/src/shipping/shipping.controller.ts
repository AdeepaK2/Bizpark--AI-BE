import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

  // ADMIN only — create shipping method
  @Post('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createMethod(
    @TenantId() tenantId: string,
    @Body() dto: { code: string; label: string; flatRate: number; currency?: string; active?: boolean },
  ) {
    return { success: true, data: await this.shippingService.createMethod(tenantId, dto) };
  }

  // ADMIN only — update shipping method (label, flatRate, currency, active)
  @Patch('methods/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateMethod(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { label?: string; flatRate?: number; currency?: string; active?: boolean },
  ) {
    return { success: true, data: await this.shippingService.updateMethod(tenantId, id, dto) };
  }

  // ADMIN only — delete shipping method
  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteMethod(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.shippingService.deleteMethod(tenantId, id) };
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
