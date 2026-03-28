import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';

type JwtUser = { id: string; tenantId: string; email: string; role: string };

@ApiTags('Orders')
@ApiSecurity('TenantId')
@ApiBearerAuth('JWT')
@Controller('api/commerce/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'List orders', description: 'ADMIN sees all orders. CUSTOMER sees only their own.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  @Get()
  async list(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    if (user.role === 'ADMIN') {
      return { success: true, ...(await this.ordersService.list(tenantId, p, l, status)) };
    }
    return { success: true, ...(await this.ordersService.listByCustomer(tenantId, user.id, p, l)) };
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order detail' })
  @ApiResponse({ status: 403, description: 'Not your order' })
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

  @ApiOperation({ summary: 'Cancel order', description: 'Customer cancels their own PENDING order. Admin can cancel any.' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Updated order' })
  @Patch(':id/cancel')
  async cancelOrder(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const customerId = user.role === 'ADMIN' ? undefined : user.id;
    if (customerId) {
      return { success: true, data: await this.ordersService.cancelByCustomer(tenantId, orderId, customerId) };
    }
    return { success: true, data: await this.ordersService.updateStatus(tenantId, orderId, 'CANCELLED') };
  }

  @ApiOperation({ summary: 'Update order status (Admin)', description: 'ADMIN only — set PENDING / PAID / FULFILLED / CANCELLED.' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Updated order' })
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

  @ApiOperation({ summary: 'Create order', description: 'Customer creates for themselves; ADMIN can create for any customer.' })
  @ApiResponse({ status: 201, description: 'Created order' })
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
