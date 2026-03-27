import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CatalogService } from './catalog.service';

@Controller('api/commerce/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // Public — anyone can browse products
  @Get('products')
  async listProducts(@TenantId() tenantId: string) {
    return { success: true, data: await this.catalogService.listProducts(tenantId) };
  }

  // Public — product detail page
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
    @Body() dto: { title: string; description?: string; price: number; currency?: string },
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
    @Body() dto: { title?: string; description?: string; price?: number; currency?: string },
  ) {
    return { success: true, data: await this.catalogService.updateProduct(tenantId, id, dto) };
  }

  // ADMIN only — delete product
  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteProduct(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.catalogService.deleteProduct(tenantId, id) };
  }
}
