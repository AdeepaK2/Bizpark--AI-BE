import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CartService } from './cart.service';

type JwtUser = { id: string; tenantId: string; email: string; role: string };

// Ownership helper — customers can only touch their own cart; admins can touch any
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
    @Body() dto: { productId: string; quantity: number },
  ) {
    assertCartAccess(user, customerId);
    return { success: true, data: await this.cartService.addItem(tenantId, customerId, dto) };
  }

  @Delete(':customerId/items/:productId')
  async removeItem(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtUser,
  ) {
    assertCartAccess(user, customerId);
    return { success: true, data: await this.cartService.removeItem(tenantId, customerId, productId) };
  }
}
