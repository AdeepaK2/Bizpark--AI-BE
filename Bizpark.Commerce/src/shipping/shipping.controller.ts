import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { ShippingService } from './shipping.service';
import { CreateShippingMethodDto, UpdateShippingMethodDto, ShippingQuoteDto } from './dtos';

@ApiTags('Shipping')
@ApiSecurity('TenantId')
@Controller('api/commerce/shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @ApiOperation({ summary: 'List shipping methods', description: 'Public — returns active shipping methods.' })
  @ApiResponse({ status: 200, description: 'Array of shipping methods' })
  @Get('methods')
  async listMethods(@TenantId() tenantId: string) {
    return { success: true, data: await this.shippingService.listMethods(tenantId) };
  }

  @ApiOperation({ summary: 'Create shipping method (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 201, description: 'Created shipping method' })
  @Post('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createMethod(
    @TenantId() tenantId: string,
    @Body() dto: CreateShippingMethodDto,
  ) {
    return { success: true, data: await this.shippingService.createMethod(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Update shipping method (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'id', description: 'Shipping method UUID' })
  @ApiResponse({ status: 200, description: 'Updated shipping method' })
  @Patch('methods/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateMethod(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShippingMethodDto,
  ) {
    return { success: true, data: await this.shippingService.updateMethod(tenantId, id, dto) };
  }

  @ApiOperation({ summary: 'Delete shipping method (Admin)' })
  @ApiBearerAuth('JWT')
  @ApiParam({ name: 'id', description: 'Shipping method UUID' })
  @ApiResponse({ status: 200, description: 'Deleted shipping method' })
  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteMethod(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.shippingService.deleteMethod(tenantId, id) };
  }

  @ApiOperation({ summary: 'Get shipping quote', description: 'Public — calculate shipping cost for a given method and order.' })
  @ApiResponse({ status: 201, description: 'Shipping quote with cost' })
  @Post('quote')
  quote(
    @TenantId() tenantId: string,
    @Body() dto: ShippingQuoteDto,
  ) {
    return this.shippingService.quote(tenantId, dto);
  }
}
