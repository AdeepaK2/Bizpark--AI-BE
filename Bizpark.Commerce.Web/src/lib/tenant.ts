export function getTenantId(): string {
  if (typeof window !== 'undefined') {
    // ?tenant=<id> takes highest priority (preview links, direct testing)
    const params = new URLSearchParams(window.location.search);
    const queryTenant = params.get('tenant');
    if (queryTenant) return queryTenant;

    // Cookie set by middleware when ?tenant= was provided
    const cookie = document.cookie.split('; ').find(c => c.startsWith('bizpark_tenant='));
    if (cookie) return cookie.split('=')[1];

    // Production — parse from subdomain
    const parts = window.location.hostname.split('.');
    if (parts.length >= 3) return parts[0];
  }

  // Server-side fallback (layout uses getTenantFromCookie directly, this is last resort)
  return process.env.NEXT_PUBLIC_TENANT_ID || 'default';
}
