import { getWebsiteConfig, getProducts } from '@/lib/api';
import HomeClient from './HomeClient';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const sp = await searchParams;
  const tenantOverride = sp?.tenant || undefined;

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
