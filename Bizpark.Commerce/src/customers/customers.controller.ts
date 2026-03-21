import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { CustomersService } from './customers.service';

@Controller('api/commerce/customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return {
      success: true,
      data: this.customersService.list(tenantId),
    };
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() dto: { email: string; name?: string },
  ) {
    return {
      success: true,
      data: this.customersService.create(tenantId, dto),
    };
  }
}
