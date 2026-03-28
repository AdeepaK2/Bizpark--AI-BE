import { Controller, Get } from '@nestjs/common';
import { TenantId } from './tenant.decorator';

@Controller('api/commerce/tenant')
export class TenantController {
  @Get('context')
  getTenantContext(@TenantId() tenantId: string) {
    return {
      success: true,
      data: {
        tenantId,
      },
    };
  }
}
