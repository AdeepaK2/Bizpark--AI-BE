import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { InventoryService } from './inventory.service';

// All inventory routes — ADMIN only
@Controller('api/commerce/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async list(@TenantId() tenantId: string) {
    return { success: true, data: await this.inventoryService.list(tenantId) };
  }

  @Get('items/:productId')
  async getByProductId(@TenantId() tenantId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.inventoryService.getByProductId(tenantId, productId) };
  }

  @Post('upsert')
  async upsert(
    @TenantId() tenantId: string,
    @Body() dto: { productId: string; sku: string; availableQuantity: number; reservedQuantity?: number },
  ) {
    return { success: true, data: await this.inventoryService.upsert(tenantId, dto) };
  }

  @Post('reserve')
  reserve(@TenantId() tenantId: string, @Body() dto: { sku: string; quantity: number }) {
    return this.inventoryService.reserve(tenantId, dto);
  }
}
