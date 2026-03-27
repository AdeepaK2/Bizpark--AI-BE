'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getProducts, getCategories, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '@/lib/api';
import type { Product, Category } from '@/types';

type ProductForm = { title: string; description: string; price: string; currency: string; categoryId: string };
const EMPTY: ProductForm = { title: '', description: '', price: '', currency: 'USD', categoryId: '' };

export default function AdminProductsPage() {
  const { token, config } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; product?: Product } | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    if (!token) return;
    setLoading(true);
    getProducts({ page, limit: 20 }).then(r => {
      setProducts(r.data); setTotal(r.total); setTotalPages(r.totalPages);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getCategories().then(r => setCategories(r.data)).catch(() => {}); }, []);

  const openCreate = () => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); };
  const openEdit = (p: Product) => {
    setForm({ title: p.title, description: p.description ?? '', price: String(p.price), currency: p.currency, categoryId: p.categoryId ?? '' });
    setError('');
    setModal({ mode: 'edit', product: p });
  };

  const handleSave = async () => {
    if (!token) return;
    setError(''); setSaving(true);
    try {
      const dto = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        currency: form.currency,
        categoryId: form.categoryId || undefined,
      };
      if (modal?.mode === 'create') {
        await adminCreateProduct(token, dto);
      } else if (modal?.product) {
        await adminUpdateProduct(token, modal.product.id, dto);
      }
      setModal(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!token || !confirm(`Delete "${p.title}"?`)) return;
    try {
      await adminDeleteProduct(token, p.id);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const fmt = (n: number, cur: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primary }}>+ New Product</button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No products yet. Create your first product.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Price</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{categories.find(c => c.id === p.categoryId)?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(p.price, p.currency)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(p)} className="text-xs px-3 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{modal.mode === 'create' ? 'New Product' : 'Edit Product'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Product name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                  <input className={inputCls} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} maxLength={3} placeholder="USD" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select className={inputCls} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.price} className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50" style={{ backgroundColor: primary }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
