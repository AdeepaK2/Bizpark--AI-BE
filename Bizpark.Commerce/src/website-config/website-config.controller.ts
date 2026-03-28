import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { WebsiteConfigService } from './website-config.service';
import type { WebsiteConfigContent } from "../db/entities";

@Controller('api/commerce/website-config')
export class WebsiteConfigController {
  constructor(private readonly configService: WebsiteConfigService) {}

  // Public — frontend fetches branding on every page load
  @Get()
  async get(@TenantId() tenantId: string) {
    return { success: true, data: await this.configService.get(tenantId) };
  }

  // Admin / Agent — update any subset of config in one call
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @TenantId() tenantId: string,
    @Body() dto: {
      businessName?: string;
      tagline?: string | null;
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string | null;
      faviconUrl?: string | null;
      currency?: string;
      locale?: string;
      content?: Partial<WebsiteConfigContent>;
    },
  ) {
    return { success: true, data: await this.configService.update(tenantId, dto) };
  }
}
