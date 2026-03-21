import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { OrdersService } from './orders.service';

@Controller('api/commerce/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return {
      success: true,
      data: this.ordersService.list(tenantId),
    };
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() dto: { customerId: string; items: Array<{ productId: string; quantity: number }> },
  ) {
    return {
      success: true,
      data: this.ordersService.create(tenantId, dto),
    };
  }
}
