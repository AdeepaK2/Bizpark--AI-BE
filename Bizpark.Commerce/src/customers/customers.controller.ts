import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CustomersService } from './customers.service';

// All customer management routes — ADMIN only
@Controller('api/commerce/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async list(@TenantId() tenantId: string) {
    return { success: true, data: await this.customersService.list(tenantId) };
  }

  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: { email: string; name?: string }) {
    return { success: true, data: await this.customersService.create(tenantId, dto) };
  }
}
