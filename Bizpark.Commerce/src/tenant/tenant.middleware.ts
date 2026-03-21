import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { TenantRequest } from '../common/request-context/tenant-request.interface';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  use(req: TenantRequest, res: Response, next: NextFunction) {
    const explicitTenantId = req.headers['x-tenant-id'];
    const tenantIdHeader = Array.isArray(explicitTenantId)
      ? explicitTenantId[0]
      : explicitTenantId;

    req.tenantId = this.tenantService.resolveTenantId(req.hostname, tenantIdHeader);
    res.setHeader('x-tenant-id', req.tenantId);

    next();
  }
}
