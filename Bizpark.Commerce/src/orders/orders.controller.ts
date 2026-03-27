import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';

type JwtUser = { id: string; tenantId: string; email: string; role: string };

@Controller('api/commerce/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Role-aware list:
  //   ADMIN  → all orders for the tenant
  //   CUSTOMER → only their own orders
  @Get()
  async list(@TenantId() tenantId: string, @CurrentUser() user: JwtUser) {
    if (user.role === 'ADMIN') {
      return { success: true, data: await this.ordersService.list(tenantId) };
    }
    return { success: true, data: await this.ordersService.listByCustomer(tenantId, user.id) };
  }

  // Any authenticated user can fetch an order — but customers only see their own
  @Get(':id')
  async getOne(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const order = await this.ordersService.getById(tenantId, orderId);
    if (user.role !== 'ADMIN' && order.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    return { success: true, data: order };
  }

  // ADMIN only — update order status (PENDING → PAID → FULFILLED | CANCELLED)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return { success: true, data: await this.ordersService.updateStatus(tenantId, orderId, dto.status) };
  }

  // JWT required — customer places order (customerId must match their own JWT id)
  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateOrderDto,
  ) {
    // Customers can only create orders for themselves
    if (user.role !== 'ADMIN' && dto.customerId !== user.id) {
      throw new ForbiddenException('Cannot create an order for another customer');
    }
    return { success: true, data: await this.ordersService.create(tenantId, dto) };
  }
}
