export function getTenantId(): string {
  if (typeof window !== 'undefined') {
    // ?tenant=<id> takes highest priority (preview links, direct testing)
    const params = new URLSearchParams(window.location.search);
    const queryTenant = params.get('tenant');
    if (queryTenant) return queryTenant;
  }
  // Build-time env var (local dev with a fixed tenant)
  if (process.env.NEXT_PUBLIC_TENANT_ID) {
    return process.env.NEXT_PUBLIC_TENANT_ID;
  }
  // Production — parse from subdomain
  if (typeof window !== 'undefined') {
    const parts = window.location.hostname.split('.');
    if (parts.length >= 3) return parts[0];
  }
  return 'default';
}
