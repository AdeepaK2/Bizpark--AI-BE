import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
  listProducts(@TenantId() tenantId: string) {
    return { success: true, data: this.catalogService.listProducts(tenantId) };
  }

  // ADMIN only — create/manage products
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createProduct(
    @TenantId() tenantId: string,
    @Body() dto: { title: string; description?: string; price: number; currency?: string },
  ) {
    return { success: true, data: this.catalogService.createProduct(tenantId, dto) };
  }
}
