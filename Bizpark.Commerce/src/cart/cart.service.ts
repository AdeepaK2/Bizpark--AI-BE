import { Injectable } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { CartEntity, CartItemEntity, ProductEntity, ProductVariantEntity } from '../db/entities';

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
    payload: { productId: string; variantId?: string | null; quantity: number },
  ) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const cartRepo = ds.getRepository(CartEntity);
    const itemRepo = ds.getRepository(CartItemEntity);

    let cart = await cartRepo.findOne({ where: { customerId } });
    if (!cart) {
      cart = await cartRepo.save(cartRepo.create({ customerId, items: [] }));
    }

    // Snapshot price + title at add time
    let unitPrice = 0;
    let unitTitle = 'Unknown Product';

    if (payload.variantId) {
      // Variant-level price takes priority
      const variantRepo = ds.getRepository(ProductVariantEntity);
      const variant = await variantRepo.findOne({ where: { id: payload.variantId } });
      if (variant) {
        unitTitle = variant.title;
        if (variant.price !== null) {
          unitPrice = Number(variant.price);
        } else {
          // Fall back to parent product price
          const productRepo = ds.getRepository(ProductEntity);
          const product = await productRepo.findOne({ where: { id: payload.productId } });
          if (product) unitPrice = Number(product.price);
        }
      }
    } else {
      const productRepo = ds.getRepository(ProductEntity);
      const product = await productRepo.findOne({ where: { id: payload.productId } });
      if (product) {
        unitPrice = Number(product.price);
        unitTitle = product.title;
      }
    }

    const quantity = Math.max(1, Number(payload.quantity || 1));

    // Match on both productId + variantId to treat same product in different variants as separate lines
    const existing = cart.items.find(
      (i: CartItemEntity) =>
        i.productId === payload.productId &&
        (i.variantId ?? null) === (payload.variantId ?? null),
    );

    if (existing) {
      existing.quantity += quantity;
      existing.unitPrice = unitPrice;
      existing.unitTitle = unitTitle;
      await itemRepo.save(existing);
    } else {
      await itemRepo.save(
        itemRepo.create({
          productId: payload.productId,
          variantId: payload.variantId ?? null,
          quantity,
          unitPrice,
          unitTitle,
          cart,
        }),
      );
    }

    return cartRepo.findOne({ where: { customerId } });
  }

  async updateItemQuantity(tenantId: string, customerId: string, itemId: string, quantity: number) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const cartRepo = ds.getRepository(CartEntity);
    const itemRepo = ds.getRepository(CartItemEntity);

    const cart = await cartRepo.findOne({ where: { customerId } });
    if (!cart) return null;

    const item = cart.items.find((i: CartItemEntity) => i.id === itemId);
    if (!item) return cartRepo.findOne({ where: { customerId } });

    const qty = Math.max(1, Number(quantity));
    item.quantity = qty;
    await itemRepo.save(item);

    return cartRepo.findOne({ where: { customerId } });
  }

  async removeItem(tenantId: string, customerId: string, itemId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const cartRepo = ds.getRepository(CartEntity);
    const itemRepo = ds.getRepository(CartItemEntity);

    const cart = await cartRepo.findOne({ where: { customerId } });
    if (!cart) return null;

    const item = cart.items.find((i: CartItemEntity) => i.id === itemId);
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
