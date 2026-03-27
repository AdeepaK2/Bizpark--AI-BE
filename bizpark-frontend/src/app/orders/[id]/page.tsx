'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { getOrder, cancelOrder } from '@/lib/api';
import type { Order } from '@/types';
import Link from 'next/link';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  FULFILLED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { config, user, token } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const currency = config?.currency ?? 'USD';

  const [order, setOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  useEffect(() => {
    if (!token) return;
    getOrder(id, token).then(r => setOrder(r.data)).catch(() => router.push('/orders'));
  }, [id, token, router]);

  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-600">Please sign in.</p>
        <Link href="/auth" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Sign in</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: primary }} /></div>;
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    setError('');
    try {
      const res = await cancelOrder(order.id, token);
      setOrder(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const shipping = order.shippingLine1
    ? [order.shippingName, order.shippingLine1, order.shippingLine2, `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`, order.shippingCountry]
        .filter(Boolean).join('\n')
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back to Orders
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">Items</p>
        </div>
        {order.items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.unitTitle}</p>
              <p className="text-xs text-gray-500">{fmt(item.unitPrice)} × {item.quantity}</p>
            </div>
            <p className="font-medium text-gray-900">{fmt(item.subtotal)}</p>
          </div>
        ))}
        <div className="flex justify-between px-6 py-4 bg-gray-50">
          <p className="font-bold text-gray-900">Total</p>
          <p className="font-bold text-gray-900">{fmt(order.totalAmount)}</p>
        </div>
      </div>

      {/* Shipping Address */}
      {shipping && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Shipping Address</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{shipping}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg mb-4">{error}</p>}

      {/* Cancel */}
      {order.status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}
    </div>
  );
}
