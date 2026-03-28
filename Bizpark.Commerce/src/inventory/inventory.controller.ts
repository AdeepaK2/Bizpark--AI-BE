import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { InventoryService } from './inventory.service';
import { UpsertInventoryDto, ReserveInventoryDto } from './dtos';

@ApiTags('Inventory')
@ApiSecurity('TenantId')
@ApiBearerAuth('JWT')
@Controller('api/commerce/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'List inventory', description: 'Admin — paginated list of all inventory items.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated inventory list' })
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

  @ApiOperation({ summary: 'Get inventory by product', description: 'Admin — list all inventory items for a specific product.' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Inventory items array' })
  @Get('items/:productId')
  async getByProductId(@TenantId() tenantId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.inventoryService.getByProductId(tenantId, productId) };
  }

  @ApiOperation({ summary: 'Upsert inventory', description: 'Admin — create or update stock level for a SKU.' })
  @ApiResponse({ status: 201, description: 'Updated inventory item' })
  @Post('upsert')
  async upsert(
    @TenantId() tenantId: string,
    @Body() dto: UpsertInventoryDto,
  ) {
    return { success: true, data: await this.inventoryService.upsert(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Reserve inventory', description: 'Admin — reserve stock for a SKU.' })
  @ApiResponse({ status: 201, description: 'Reservation result' })
  @Post('reserve')
  reserve(@TenantId() tenantId: string, @Body() dto: ReserveInventoryDto) {
    return this.inventoryService.reserve(tenantId, dto);
  }
}
