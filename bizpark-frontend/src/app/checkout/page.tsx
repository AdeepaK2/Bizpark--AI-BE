'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { completeCheckout, getShippingMethods } from '@/lib/api';
import type { ShippingMethod } from '@/types';
import Link from 'next/link';

interface ShippingForm {
  name: string; line1: string; line2: string;
  city: string; state: string; postalCode: string; country: string;
}

export default function CheckoutPage() {
  const { config, user, token, cart, refreshCart } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const currency = config?.currency ?? 'USD';
  const router = useRouter();

  const [form, setForm] = useState<ShippingForm>({ name: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US' });
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getShippingMethods().then(r => {
      const active = r.data.filter(m => m.active);
      setShippingMethods(active);
      if (active.length > 0) setSelectedMethod(active[0].id);
    }).catch(() => {});
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  if (user === undefined) return null; // still hydrating
  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-600">Please sign in to checkout.</p>
        <Link href="/auth" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Sign in</Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/shop" className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>Shop</Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const selectedShipping = shippingMethods.find(m => m.id === selectedMethod);
  const shippingCost = selectedShipping?.flatRate ?? 0;
  const total = subtotal + shippingCost;

  const set = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await completeCheckout(user.id, token, {
        name: form.name, line1: form.line1, line2: form.line2 || undefined,
        city: form.city, state: form.state || undefined, postalCode: form.postalCode, country: form.country,
      });
      await refreshCart();
      router.push(`/orders/${res.order.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-5">

          {/* Shipping Address */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input className={inputCls} required value={form.name} onChange={set('name')} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input className={inputCls} required value={form.line1} onChange={set('line1')} placeholder="123 Main St" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 <span className="text-gray-400">(optional)</span></label>
                <input className={inputCls} value={form.line2} onChange={set('line2')} placeholder="Apt, suite, unit..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input className={inputCls} required value={form.city} onChange={set('city')} placeholder="New York" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                  <input className={inputCls} value={form.state} onChange={set('state')} placeholder="NY" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input className={inputCls} required value={form.postalCode} onChange={set('postalCode')} placeholder="10001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input className={inputCls} required value={form.country} onChange={set('country')} placeholder="US" maxLength={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Method */}
          {shippingMethods.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Shipping Method</h2>
              <div className="space-y-2">
                {shippingMethods.map(m => (
                  <label key={m.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedMethod === m.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`} style={selectedMethod === m.id ? { borderColor: primary, backgroundColor: `${primary}0d` } : {}}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value={m.id} checked={selectedMethod === m.id} onChange={() => setSelectedMethod(m.id)} className="text-primary" />
                      <span className="text-sm font-medium text-gray-900">{m.label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: primary }}>
                      {m.flatRate === 0 ? 'Free' : fmt(m.flatRate)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: primary }}>
            {loading ? 'Placing Order...' : `Place Order · ${fmt(total)}`}
          </button>
        </form>

        {/* Order Summary */}
        <div className="bg-white border rounded-xl p-6 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 flex-1 pr-2 line-clamp-1">{item.unitTitle} × {item.quantity}</span>
                <span className="font-medium text-gray-900 shrink-0">{fmt(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {selectedShipping && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{selectedShipping.flatRate === 0 ? 'Free' : fmt(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
