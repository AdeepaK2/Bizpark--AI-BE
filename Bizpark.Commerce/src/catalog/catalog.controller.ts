import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { CatalogService } from './catalog.service';

@Controller('api/commerce/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  listProducts(@TenantId() tenantId: string) {
    return {
      success: true,
      data: this.catalogService.listProducts(tenantId),
    };
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  createProduct(
    @TenantId() tenantId: string,
    @Body()
    dto: {
      title: string;
      description?: string;
      price: number;
      currency?: string;
    },
  ) {
    return {
      success: true,
      data: this.catalogService.createProduct(tenantId, dto),
    };
  }
}
