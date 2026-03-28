'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { adminListCustomers } from '@/lib/api';
import type { Customer } from '@/types';

export default function AdminCustomersPage() {
  const { token, config } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminListCustomers(token)
      .then(r => setCustomers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} registered</p>
        </div>
        <input
          className="border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 w-56 bg-white"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">{search ? 'No customers match your search.' : 'No customers yet.'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Role</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.email}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
