import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { InventoryService } from './inventory.service';

@Controller('api/commerce/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async list(
    @TenantId() tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return { success: true, ...(await this.inventoryService.list(tenantId, p, l)) };
  }

  @Get('items/:productId')
  async getByProductId(@TenantId() tenantId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.inventoryService.getByProductId(tenantId, productId) };
  }

  @Post('upsert')
  async upsert(
    @TenantId() tenantId: string,
    @Body() dto: { productId: string; sku: string; availableQuantity: number; reservedQuantity?: number; variantId?: string },
  ) {
    return { success: true, data: await this.inventoryService.upsert(tenantId, dto) };
  }

  @Post('reserve')
  reserve(@TenantId() tenantId: string, @Body() dto: { sku: string; quantity: number }) {
    return this.inventoryService.reserve(tenantId, dto);
  }
}
