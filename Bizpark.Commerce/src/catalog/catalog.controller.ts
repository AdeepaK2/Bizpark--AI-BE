import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CatalogService } from './catalog.service';
import { CreateProductDto, UpdateProductDto } from './dtos';

@ApiTags('Catalog — Products')
@ApiSecurity('TenantId')
@Controller('api/commerce/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiOperation({ summary: 'List products', description: 'Public — browse with optional search, category filter, and pagination.' })
  @ApiQuery({ name: 'search', required: false, example: 'shirt' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  @Get('products')
  async listProducts(
    @TenantId() tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return {
      success: true,
      ...(await this.catalogService.listProducts(tenantId, {
        categoryId,
        search: search?.trim() || undefined,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
      })),
    };
  }

  @ApiOperation({ summary: 'Get product', description: 'Public — fetch single product by ID.' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product detail' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get('products/:id')
  async getProduct(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.catalogService.getProduct(tenantId, id) };
  }

  @ApiOperation({ summary: 'Create product (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 201, description: 'Created product' })
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createProduct(
    @TenantId() tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return { success: true, data: await this.catalogService.createProduct(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Update product (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Updated product' })
  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateProduct(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return { success: true, data: await this.catalogService.updateProduct(tenantId, id, dto) };
  }

  @ApiOperation({ summary: 'Delete product (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Deleted product' })
  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteProduct(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.catalogService.deleteProduct(tenantId, id) };
  }
}
