'use client';

import { useApp } from '@/context/AppContext';
import { updateCartItem, removeCartItem } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CartPage() {
  const { config, user, token, cart, refreshCart } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const currency = config?.currency ?? 'USD';
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  if (user === undefined) return null; // still hydrating
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-600">Please sign in to view your cart.</p>
        <Link href="/auth" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Sign in</Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/shop" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Continue Shopping</Link>
      </div>
    );
  }

  const total = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const handleQty = async (itemId: string, qty: number) => {
    if (!token) return;
    setLoading(itemId);
    try {
      await updateCartItem(user.id, itemId, qty, token);
      await refreshCart();
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!token) return;
    setLoading(itemId);
    try {
      await removeCartItem(user.id, itemId, token);
      await refreshCart();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

      <div className="space-y-4">
        {cart.items.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-white border rounded-xl p-4">
            {/* Item image placeholder */}
            <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/shop/${item.productId}`} className="font-medium text-gray-900 hover:underline line-clamp-1">
                {item.unitTitle}
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">{fmt(item.unitPrice)} each</p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => handleQty(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1 || loading === item.id}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm"
              >−</button>
              <span className="px-3 py-1.5 text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => handleQty(item.id, item.quantity + 1)}
                disabled={loading === item.id}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm"
              >+</button>
            </div>

            <p className="font-bold text-gray-900 w-20 text-right">{fmt(item.unitPrice * item.quantity)}</p>

            <button
              onClick={() => handleRemove(item.id)}
              disabled={loading === item.id}
              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 ml-2"
              aria-label="Remove"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(total)}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/shop" className="px-6 py-2.5 border rounded-lg text-sm font-medium text-center hover:bg-gray-50">
            Continue Shopping
          </Link>
          <button
            onClick={() => router.push('/checkout')}
            className="px-8 py-2.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
