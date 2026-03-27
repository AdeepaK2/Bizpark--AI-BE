'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getOrders } from '@/lib/api';
import type { Order } from '@/types';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  FULFILLED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function OrdersPage() {
  const { config, user, token } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const currency = config?.currency ?? 'USD';

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getOrders(token, page)
      .then(r => { setOrders(r.data); setTotalPages(r.totalPages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page]);

  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-600">Please sign in to view your orders.</p>
        <Link href="/auth" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">No orders yet.</p>
          <Link href="/shop" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center gap-4 bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {order.status}
              </span>
              <p className="font-bold text-gray-900 w-24 text-right">{fmt(order.totalAmount)}</p>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
