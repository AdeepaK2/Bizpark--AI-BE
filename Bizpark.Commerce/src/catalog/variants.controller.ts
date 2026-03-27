import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { VariantsService } from './variants.service';

@Controller('api/commerce/catalog/products/:productId/variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  // Public — list variants for a product
  @Get()
  async list(@TenantId() tenantId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.variantsService.list(tenantId, productId) };
  }

  // Public — get single variant
  @Get(':variantId')
  async getOne(@TenantId() tenantId: string, @Param('variantId') variantId: string) {
    return { success: true, data: await this.variantsService.getById(tenantId, variantId) };
  }

  // ADMIN — create variant
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @TenantId() tenantId: string,
    @Param('productId') productId: string,
    @Body() dto: { title: string; sku: string; price?: number | null; attributes?: Record<string, string>; isActive?: boolean },
  ) {
    return { success: true, data: await this.variantsService.create(tenantId, productId, dto) };
  }

  // ADMIN — update variant
  @Patch(':variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @TenantId() tenantId: string,
    @Param('variantId') variantId: string,
    @Body() dto: { title?: string; sku?: string; price?: number | null; attributes?: Record<string, string>; isActive?: boolean },
  ) {
    return { success: true, data: await this.variantsService.update(tenantId, variantId, dto) };
  }

  // ADMIN — delete variant
  @Delete(':variantId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@TenantId() tenantId: string, @Param('variantId') variantId: string) {
    return { success: true, data: await this.variantsService.delete(tenantId, variantId) };
  }
}
