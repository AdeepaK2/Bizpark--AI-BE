import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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

  @Get()
  async list(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    if (user.role === 'ADMIN') {
      return { success: true, ...(await this.ordersService.list(tenantId, p, l)) };
    }
    return { success: true, ...(await this.ordersService.listByCustomer(tenantId, user.id, p, l)) };
  }

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

  // Customer cancels their own PENDING order
  @Patch(':id/cancel')
  async cancelOrder(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @CurrentUser() user: JwtUser,
  ) {
    // Admin can cancel any order via this endpoint too
    const customerId = user.role === 'ADMIN' ? undefined : user.id;
    if (customerId) {
      return { success: true, data: await this.ordersService.cancelByCustomer(tenantId, orderId, customerId) };
    }
    return { success: true, data: await this.ordersService.updateStatus(tenantId, orderId, 'CANCELLED') };
  }

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

  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateOrderDto,
  ) {
    if (user.role !== 'ADMIN' && dto.customerId !== user.id) {
      throw new ForbiddenException('Cannot create an order for another customer');
    }
    return { success: true, data: await this.ordersService.create(tenantId, dto) };
  }
}
