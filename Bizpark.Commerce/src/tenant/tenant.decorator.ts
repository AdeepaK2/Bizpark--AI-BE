import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantRequest } from '../common/request-context/tenant-request.interface';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    return req.tenantId || 'public';
  },
);
