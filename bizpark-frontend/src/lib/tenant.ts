export function getTenantId(): string {
  // Local dev — use env var
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
