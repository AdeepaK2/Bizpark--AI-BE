import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dtos';

@ApiTags('Customers')
@ApiSecurity('TenantId')
@ApiBearerAuth('JWT')
@Controller('api/commerce/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'List customers', description: 'Admin — list all registered customers.' })
  @ApiResponse({ status: 200, description: 'Array of customers' })
  @Get()
  async list(@TenantId() tenantId: string) {
    return { success: true, data: await this.customersService.list(tenantId) };
  }

  @ApiOperation({ summary: 'Get customer', description: 'Admin — fetch single customer by ID.' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer object' })
  @Get(':id')
  async getOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.customersService.getById(tenantId, id) };
  }

  @ApiOperation({ summary: 'Create customer', description: 'Admin — create a new customer account.' })
  @ApiResponse({ status: 201, description: 'Created customer' })
  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateCustomerDto) {
    return { success: true, data: await this.customersService.create(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Update customer', description: 'Admin — update customer email or name.' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Updated customer' })
  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return { success: true, data: await this.customersService.update(tenantId, id, dto) };
  }
}
