import { cookies } from 'next/headers';
import { getWebsiteConfig, getProducts } from '@/lib/api';
import HomeClient from './HomeClient';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const sp = await searchParams;
  // ?tenant= takes priority; fall back to cookie set by middleware on prior visit
  const cookieStore = await cookies();
  const tenantOverride = sp?.tenant || cookieStore.get('bizpark_tenant')?.value || undefined;

  const [configRes, productsRes] = await Promise.all([
    getWebsiteConfig(tenantOverride).catch(() => null),
    getProducts({ limit: 8 }, tenantOverride).catch(() => null),
  ]);

  return (
    <HomeClient
      config={configRes?.data ?? null}
      featuredProducts={productsRes?.data ?? []}
    />
  );
}
