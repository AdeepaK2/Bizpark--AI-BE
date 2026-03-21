import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantService {
  resolveTenantId(host?: string, explicitTenantId?: string): string {
    if (explicitTenantId && explicitTenantId.trim()) {
      return explicitTenantId.trim().toLowerCase();
    }

    if (!host) {
      return 'public';
    }

    const cleanHost = host.split(':')[0].trim().toLowerCase();
    const parts = cleanHost.split('.');

    if (parts.length >= 3) {
      return parts[0] || 'public';
    }

    return 'public';
  }
}
