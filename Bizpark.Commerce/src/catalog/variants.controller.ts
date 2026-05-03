import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { VariantsService } from './variants.service';
import { CreateVariantDto, UpdateVariantDto } from './dtos';

@ApiTags('Catalog — Variants')
@ApiSecurity('TenantId')
@Controller('api/commerce/catalog/products/:productId/variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @ApiOperation({ summary: 'List variants', description: 'Public — list all variants for a product.' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Array of variants' })
  @Get()
  async list(@TenantId() tenantId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.variantsService.list(tenantId, productId) };
  }

  @ApiOperation({ summary: 'Get variant', description: 'Public — fetch single variant by ID.' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiResponse({ status: 200, description: 'Variant object' })
  @Get(':variantId')
  async getOne(@TenantId() tenantId: string, @Param('variantId') variantId: string) {
    return { success: true, data: await this.variantsService.getById(tenantId, variantId) };
  }

  @ApiOperation({ summary: 'Create variant (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 201, description: 'Created variant' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @TenantId() tenantId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return { success: true, data: await this.variantsService.create(tenantId, productId, dto) };
  }

  @ApiOperation({ summary: 'Update variant (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiResponse({ status: 200, description: 'Updated variant' })
  @Patch(':variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @TenantId() tenantId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return { success: true, data: await this.variantsService.update(tenantId, variantId, dto) };
  }

  @ApiOperation({ summary: 'Delete variant (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiResponse({ status: 200, description: 'Deleted variant' })
  @Delete(':variantId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@TenantId() tenantId: string, @Param('variantId') variantId: string) {
    return { success: true, data: await this.variantsService.delete(tenantId, variantId) };
  }
}
