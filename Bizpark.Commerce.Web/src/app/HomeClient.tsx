'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { WebsiteConfig, Product } from '@/types';
import ProductCard from '@/components/ProductCard';

// ── Icon helper ──────────────────────────────────────────────────────────────
function FeatureIcon({ name }: { name: string }) {
  const cls = 'w-8 h-8';
  switch (name) {
    case 'truck':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 0M13 16l2 0m0 0h2a1 1 0 001-1v-5l-3-4h-3v9z"/></svg>;
    case 'refresh':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
    case 'shield':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
    case 'headphones':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 18v-6a9 9 0 0118 0v6"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>;
    default: // sparkles
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
  }
}

interface Props {
  config: WebsiteConfig | null;
  featuredProducts: Product[];
}

export default function HomeClient({ config, featuredProducts }: Props) {
  const c = config?.content;
  const primary = config?.primaryColor ?? '#2563eb';

  // ── Defaults when agent hasn't configured yet ──────────────────────────────
  const hero = c?.hero ?? {};
  const heroTitle = hero.title ?? config?.businessName ?? 'Welcome to Our Store';
  const heroSubtitle = hero.subtitle ?? config?.tagline ?? 'Discover amazing products curated just for you.';
  const heroCTA = hero.ctaText ?? 'Shop Now';
  const heroCTALink = hero.ctaLink ?? '/shop';

  const defaultFeatures = [
    { icon: 'truck', title: 'Free Shipping', description: 'On all orders over $50' },
    { icon: 'refresh', title: 'Easy Returns', description: '30-day hassle-free returns' },
    { icon: 'shield', title: 'Secure Payment', description: 'Your data is always protected' },
    { icon: 'headphones', title: '24/7 Support', description: 'We\'re here when you need us' },
  ];
  const features = c?.features?.length ? c.features : defaultFeatures;

  const announcement = c?.announcement;
  const about = c?.about;

  return (
    <div className="flex flex-col">

      {/* ── Announcement Bar ── agent sets content.announcement ── */}
      {announcement?.enabled && (
        <div
          className="text-center py-2 px-4 text-sm font-medium"
          style={{
            backgroundColor: announcement.bgColor ?? primary,
            color: announcement.textColor ?? '#fff',
          }}
        >
          {announcement.text}
        </div>
      )}

      {/* ── Hero Section ── agent sets content.hero ── */}
      <section className="relative min-h-[480px] flex items-center overflow-hidden bg-gray-900">
        {hero.imageUrl && (
          <Image
            src={hero.imageUrl}
            alt={heroTitle}
            fill
            className="object-cover opacity-50"
            priority
          />
        )}
        {!hero.imageUrl && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}cc, ${config?.secondaryColor ?? '#1e40af'}cc)` }} />
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-white max-w-2xl leading-tight">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="mt-4 text-lg text-white/80 max-w-xl">{heroSubtitle}</p>
          )}
          <Link
            href={heroCTALink}
            className="inline-block mt-8 px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            {heroCTA}
          </Link>
        </div>
      </section>

      {/* ── Features / Trust Row ── agent sets content.features ── */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="text-primary" style={{ color: primary }}>
                  <FeatureIcon name={f.icon} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── auto from catalog ── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/shop" className="text-sm font-medium hover:underline" style={{ color: primary }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} currency={config?.currency ?? 'USD'} />
            ))}
          </div>
        </section>
      )}

      {/* ── About Section ── agent sets content.about ── */}
      {about && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex flex-col ${about.imageUrl ? 'md:flex-row' : ''} gap-12 items-center`}>
              {about.imageUrl && (
                <div className="w-full md:w-1/2 relative aspect-video rounded-xl overflow-hidden">
                  <Image src={about.imageUrl} alt={about.title ?? 'About us'} fill className="object-cover" />
                </div>
              )}
              <div className={about.imageUrl ? 'md:w-1/2' : 'max-w-2xl mx-auto text-center'}>
                {about.title && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{about.title}</h2>
                )}
                {about.text && (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{about.text}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
