'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/shipping', label: 'Shipping' },
  { href: '/admin/config', label: 'Store Config' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, config } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const primary = config?.primaryColor ?? '#2563eb';

  useEffect(() => {
    if (user === undefined) return; // still hydrating
    if (!user || user.role !== 'ADMIN') router.replace('/auth');
  }, [user, router]);

  // Still loading session from localStorage — render nothing to avoid flash
  if (user === null) return null;
  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col shrink-0">
        <div className="px-5 py-4 border-b">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
          <p className="font-bold text-sm mt-0.5 truncate" style={{ color: primary }}>{config?.businessName ?? 'Store'}</p>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={active ? { backgroundColor: primary } : {}}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-700 mt-1 block">← Back to store</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
