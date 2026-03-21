import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { InventoryService } from './inventory.service';

@Controller('api/commerce/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return {
      success: true,
      data: this.inventoryService.list(tenantId),
    };
  }

  @Post('upsert')
  upsert(
    @TenantId() tenantId: string,
    @Body() dto: { productId: string; sku: string; availableQuantity: number; reservedQuantity?: number },
  ) {
    return {
      success: true,
      data: this.inventoryService.upsert(tenantId, dto),
    };
  }

  @Post('reserve')
  reserve(@TenantId() tenantId: string, @Body() dto: { sku: string; quantity: number }) {
    return this.inventoryService.reserve(tenantId, dto);
  }
}
