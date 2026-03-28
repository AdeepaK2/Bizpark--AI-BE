import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    service = new TenantService();
  });

  describe('resolveTenantId', () => {
    it('uses explicit x-tenant-id header when provided', () => {
      expect(service.resolveTenantId('anyhost.com', 'my-tenant')).toBe('my-tenant');
    });

    it('normalizes explicit tenant id to lowercase', () => {
      expect(service.resolveTenantId(undefined, '  MyTenant  ')).toBe('mytenant');
    });

    it('extracts subdomain from multi-part hostname', () => {
      expect(service.resolveTenantId('priya.bizspark.app', undefined)).toBe('priya');
    });

    it('returns "public" for two-part hostname (no subdomain)', () => {
      expect(service.resolveTenantId('bizspark.app', undefined)).toBe('public');
    });

    it('returns "public" when no host and no explicit tenant', () => {
      expect(service.resolveTenantId(undefined, undefined)).toBe('public');
    });

    it('returns "public" for empty explicit tenant id', () => {
      expect(service.resolveTenantId('host.com', '   ')).toBe('public');
    });

    it('prefers explicit header over subdomain', () => {
      expect(service.resolveTenantId('priya.bizspark.app', 'override')).toBe('override');
    });
  });
});
