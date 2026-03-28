'use client';

import { useEffect, useState } from 'react';
import { getProducts, getCategories } from '@/lib/api';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useApp } from '@/context/AppContext';

function flattenCategories(cats: Category[]): { id: string; name: string; depth: number }[] {
  return cats.flatMap(c => [
    { id: c.id, name: c.name, depth: 0 },
    ...(c.children ?? []).map(ch => ({ id: ch.id, name: ch.name, depth: 1 })),
  ]);
}

export default function ShopPage() {
  const { config } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const currency = config?.currency ?? 'USD';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (s: string, cat: string, p: number) => {
    setLoading(true);
    try {
      const res = await getProducts({ search: s || undefined, categoryId: cat || undefined, page: p, limit: 12 });
      setProducts(res.data);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getCategories().then(r => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => { load(search, categoryId, page); }, [search, categoryId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCategory = (v: string) => { setCategoryId(v); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shop</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': primary } as React.CSSProperties}
        />
        <select
          value={categoryId}
          onChange={e => handleCategory(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm bg-white focus:outline-none"
        >
          <option value="">All Categories</option>
          {flattenCategories(categories).map(c => (
            <option key={c.id} value={c.id}>{c.depth > 0 ? `\u00a0\u00a0↳ ${c.name}` : c.name}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-500">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} currency={currency} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
