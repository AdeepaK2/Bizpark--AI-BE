'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function AuthPage() {
  const { config, login } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiLogin(email, password);
        login(res.access_token, res.user);
      } else {
        const res = await apiRegister(email, password, name);
        login(res.access_token, res.user);
      }
      router.push('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {mode === 'login' ? 'Welcome back to ' : 'Start shopping at '}
            <span className="font-medium" style={{ color: primary }}>{config?.businessName ?? 'our store'}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ backgroundColor: primary }}
            >
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => setMode('register')} className="font-medium hover:underline" style={{ color: primary }}>
                  Register
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="font-medium hover:underline" style={{ color: primary }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
