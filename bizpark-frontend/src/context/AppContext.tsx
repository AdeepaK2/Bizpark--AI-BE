'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser, Cart, WebsiteConfig } from '@/types';
import { getCart, getMe, getWebsiteConfig } from '@/lib/api';

interface AppState {
  config: WebsiteConfig | null;
  user: AuthUser | null;
  token: string | null;
  cart: Cart | null;
  cartCount: number;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshCart: () => Promise<void>;
}

const AppContext = createContext<AppState>({
  config: null, user: null, token: null, cart: null, cartCount: 0,
  login: () => {}, logout: () => {}, refreshCart: async () => {},
});

export function AppProvider({ children, initialConfig }: { children: React.ReactNode; initialConfig: WebsiteConfig | null }) {
  const [config] = useState<WebsiteConfig | null>(initialConfig);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('biz_token');
    const storedUser = localStorage.getItem('biz_user');
    if (stored && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setToken(stored);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('biz_token');
        localStorage.removeItem('biz_user');
      }
    }
  }, []);

  // Load cart when user is set
  useEffect(() => {
    if (user && token) refreshCart();
    else setCart(null);
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshCart = async () => {
    if (!user || !token) return;
    try {
      const res = await getCart(user.id, token);
      setCart(res.data);
    } catch {
      setCart(null);
    }
  };

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('biz_token', newToken);
    localStorage.setItem('biz_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCart(null);
    localStorage.removeItem('biz_token');
    localStorage.removeItem('biz_user');
  };

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <AppContext.Provider value={{ config, user, token, cart, cartCount, login, logout, refreshCart }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
