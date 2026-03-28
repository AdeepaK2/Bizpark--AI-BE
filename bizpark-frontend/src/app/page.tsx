import { getWebsiteConfig, getProducts } from '@/lib/api';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const [configRes, productsRes] = await Promise.all([
    getWebsiteConfig().catch(() => null),
    getProducts({ limit: 8 }).catch(() => null),
  ]);

  return (
    <HomeClient
      config={configRes?.data ?? null}
      featuredProducts={productsRes?.data ?? []}
    />
  );
}
