import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dtos';

type JwtUser = { id: string; tenantId: string; email: string; role: string };

function assertCartAccess(user: JwtUser, customerId: string) {
  if (user.role !== 'ADMIN' && user.id !== customerId) {
    throw new ForbiddenException('Access denied: not your cart');
  }
}

@Controller('api/commerce/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':customerId')
  async getCart(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: JwtUser,
  ) {
    assertCartAccess(user, customerId);
    return { success: true, data: await this.cartService.getCart(tenantId, customerId) };
  }

  @Post(':customerId/items')
  async addItem(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: AddCartItemDto,
  ) {
    assertCartAccess(user, customerId);
    return { success: true, data: await this.cartService.addItem(tenantId, customerId, dto) };
  }

  // Update quantity of a specific cart item
  @Patch(':customerId/items/:itemId')
  async updateItem(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateCartItemDto,
  ) {
    assertCartAccess(user, customerId);
    return { success: true, data: await this.cartService.updateItemQuantity(tenantId, customerId, itemId, dto.quantity) };
  }

  // Remove by cart item ID (supports multiple variants of same product)
  @Delete(':customerId/items/:itemId')
  async removeItem(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: JwtUser,
  ) {
    assertCartAccess(user, customerId);
    return { success: true, data: await this.cartService.removeItem(tenantId, customerId, itemId) };
  }
}
