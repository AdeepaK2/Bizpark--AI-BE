import { Injectable } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { CartEntity, CartItemEntity } from '../db/entities';

@Injectable()
export class CartService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async getCart(tenantId: string, customerId: string): Promise<CartEntity> {
    const repo = await this.repo(tenantId);
    let cart = await repo.findOne({ where: { customerId } });
    if (!cart) {
      cart = await repo.save(repo.create({ customerId, items: [] }));
    }
    return cart;
  }

  async addItem(
    tenantId: string,
    customerId: string,
    payload: { productId: string; quantity: number },
  ) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const cartRepo = ds.getRepository(CartEntity);
    const itemRepo = ds.getRepository(CartItemEntity);

    let cart = await cartRepo.findOne({ where: { customerId } });
    if (!cart) {
      cart = await cartRepo.save(cartRepo.create({ customerId, items: [] }));
    }

    const quantity = Math.max(1, Number(payload.quantity || 1));
    const existing = cart.items.find((i: CartItemEntity) => i.productId === payload.productId);

    if (existing) {
      existing.quantity += quantity;
      await itemRepo.save(existing);
    } else {
      await itemRepo.save(itemRepo.create({ productId: payload.productId, quantity, cart }));
    }

    return cartRepo.findOne({ where: { customerId } });
  }

  async removeItem(tenantId: string, customerId: string, productId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const cartRepo = ds.getRepository(CartEntity);
    const itemRepo = ds.getRepository(CartItemEntity);

    const cart = await cartRepo.findOne({ where: { customerId } });
    if (!cart) return null;

    const item = cart.items.find((i: CartItemEntity) => i.productId === productId);
    if (item) await itemRepo.remove(item);

    return cartRepo.findOne({ where: { customerId } });
  }

  async clearCart(tenantId: string, customerId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const cartRepo = ds.getRepository(CartEntity);
    const itemRepo = ds.getRepository(CartItemEntity);

    const cart = await cartRepo.findOne({ where: { customerId } });
    if (cart && cart.items.length > 0) {
      await itemRepo.remove(cart.items);
    }
    return cart;
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(CartEntity);
  }
}
