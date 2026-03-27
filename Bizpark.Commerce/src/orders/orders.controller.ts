import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { OrdersService } from './orders.service';

@Controller('api/commerce/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ADMIN only — view all orders
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  list(@TenantId() tenantId: string) {
    return { success: true, data: this.ordersService.list(tenantId) };
  }

  // CUSTOMER — place an order
  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() dto: { customerId: string; items: Array<{ productId: string; quantity: number }> },
  ) {
    return { success: true, data: this.ordersService.create(tenantId, dto) };
  }
}
