import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos';

@ApiTags('Catalog — Categories')
@ApiSecurity('TenantId')
@Controller('api/commerce/catalog/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List categories', description: 'Public — returns full category tree with children.' })
  @ApiResponse({ status: 200, description: 'Category tree array' })
  @Get()
  async list(@TenantId() tenantId: string) {
    return { success: true, data: await this.categoriesService.list(tenantId) };
  }

  @ApiOperation({ summary: 'Get category', description: 'Public — fetch single category by ID.' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category object' })
  @Get(':id')
  async getOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.categoriesService.getById(tenantId, id) };
  }

  @ApiOperation({ summary: 'Create category (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 201, description: 'Created category' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return { success: true, data: await this.categoriesService.create(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Update category (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Updated category' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return { success: true, data: await this.categoriesService.update(tenantId, id, dto) };
  }

  @ApiOperation({ summary: 'Delete category (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Deleted category' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.categoriesService.delete(tenantId, id) };
  }
}
