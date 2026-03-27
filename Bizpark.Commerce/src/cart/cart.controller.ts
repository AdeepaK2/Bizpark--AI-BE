import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { CartService } from './cart.service';

@Controller('api/commerce/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':customerId')
  async getCart(@TenantId() tenantId: string, @Param('customerId') customerId: string) {
    return { success: true, data: await this.cartService.getCart(tenantId, customerId) };
  }

  @Post(':customerId/items')
  async addItem(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Body() dto: { productId: string; quantity: number },
  ) {
    return { success: true, data: await this.cartService.addItem(tenantId, customerId, dto) };
  }

  @Delete(':customerId/items/:productId')
  async removeItem(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Param('productId') productId: string,
  ) {
    return { success: true, data: await this.cartService.removeItem(tenantId, customerId, productId) };
  }
}
