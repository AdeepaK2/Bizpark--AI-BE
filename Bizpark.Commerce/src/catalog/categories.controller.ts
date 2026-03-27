import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CategoriesService } from './categories.service';

@Controller('api/commerce/catalog/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Public — category tree
  @Get()
  async list(@TenantId() tenantId: string) {
    return { success: true, data: await this.categoriesService.list(tenantId) };
  }

  // Public — single category
  @Get(':id')
  async getOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.categoriesService.getById(tenantId, id) };
  }

  // ADMIN — create category
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @TenantId() tenantId: string,
    @Body() dto: { name: string; slug: string; description?: string; parentId?: string | null; sortOrder?: number },
  ) {
    return { success: true, data: await this.categoriesService.create(tenantId, dto) };
  }

  // ADMIN — update category
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { name?: string; slug?: string; description?: string; parentId?: string | null; sortOrder?: number; isActive?: boolean },
  ) {
    return { success: true, data: await this.categoriesService.update(tenantId, id, dto) };
  }

  // ADMIN — delete category
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.categoriesService.delete(tenantId, id) };
  }
}
