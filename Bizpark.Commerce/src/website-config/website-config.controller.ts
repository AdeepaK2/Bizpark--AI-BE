import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { WebsiteConfigService } from './website-config.service';
import { UpdateWebsiteConfigDto } from './dtos';

@ApiTags('Website Config')
@ApiSecurity('TenantId')
@Controller('api/commerce/website-config')
export class WebsiteConfigController {
  constructor(private readonly configService: WebsiteConfigService) {}

  @ApiOperation({ summary: 'Get website config', description: 'Public — returns branding, colors, content for the storefront.' })
  @ApiResponse({ status: 200, description: 'Website config object' })
  @Get()
  async get(@TenantId() tenantId: string) {
    return { success: true, data: await this.configService.get(tenantId) };
  }

  @ApiOperation({ summary: 'Update website config (Admin)', description: 'Update any subset of branding, content, SEO fields.' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'Updated config' })
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @TenantId() tenantId: string,
    @Body() dto: UpdateWebsiteConfigDto,
  ) {
    return { success: true, data: await this.configService.update(tenantId, dto) };
  }
}
