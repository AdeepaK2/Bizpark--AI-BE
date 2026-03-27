import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CatalogService } from './catalog.service';

@Controller('api/commerce/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // Public — browse products with optional category filter + pagination
  @Get('products')
  async listProducts(
    @TenantId() tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return {
      success: true,
      ...(await this.catalogService.listProducts(tenantId, {
        categoryId,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
      })),
    };
  }

  // Public — product detail
  @Get('products/:id')
  async getProduct(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.catalogService.getProduct(tenantId, id) };
  }

  // ADMIN only — create product
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createProduct(
    @TenantId() tenantId: string,
    @Body() dto: { title: string; description?: string; price: number; currency?: string; categoryId?: string },
  ) {
    return { success: true, data: await this.catalogService.createProduct(tenantId, dto) };
  }

  // ADMIN only — update product
  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateProduct(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; price?: number; currency?: string; categoryId?: string | null },
  ) {
    return { success: true, data: await this.catalogService.updateProduct(tenantId, id, dto) };
  }

  // ADMIN only — soft delete product
  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteProduct(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.catalogService.deleteProduct(tenantId, id) };
  }
}
