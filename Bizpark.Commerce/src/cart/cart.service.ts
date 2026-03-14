import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type CartItem = {
  productId: string;
  quantity: number;
};

type Cart = {
  id: string;
  tenantId: string;
  customerId: string;
  items: CartItem[];
  updatedAt: string;
};

@Injectable()
export class CartService {
  private readonly cartsByTenant = new Map<string, Map<string, Cart>>();

  getCart(tenantId: string, customerId: string): Cart {
    const tenantCarts = this.ensureTenantCarts(tenantId);
    let cart = tenantCarts.get(customerId);

    if (!cart) {
      cart = {
        id: randomUUID(),
        tenantId,
        customerId,
        items: [],
        updatedAt: new Date().toISOString(),
      };
      tenantCarts.set(customerId, cart);
    }

    return cart;
  }

  addItem(tenantId: string, customerId: string, payload: { productId: string; quantity: number }) {
    const cart = this.getCart(tenantId, customerId);
    const quantity = Math.max(1, Number(payload.quantity || 1));

    const existing = cart.items.find((item) => item.productId === payload.productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId: payload.productId, quantity });
    }

    cart.updatedAt = new Date().toISOString();
    return cart;
  }

  removeItem(tenantId: string, customerId: string, productId: string) {
    const cart = this.getCart(tenantId, customerId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    cart.updatedAt = new Date().toISOString();
    return cart;
  }

  clearCart(tenantId: string, customerId: string) {
    const cart = this.getCart(tenantId, customerId);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
    return cart;
  }

  private ensureTenantCarts(tenantId: string) {
    let carts = this.cartsByTenant.get(tenantId);
    if (!carts) {
      carts = new Map<string, Cart>();
      this.cartsByTenant.set(tenantId, carts);
    }
    return carts;
  }
}
