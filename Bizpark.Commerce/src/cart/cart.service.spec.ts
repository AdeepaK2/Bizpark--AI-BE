import { CartService } from './cart.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';

function makeFactory(cartRepo: any, itemRepo?: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({
      getRepository: jest.fn((entity) => {
        const name = entity?.name ?? '';
        return name === 'CartItemEntity' ? (itemRepo ?? cartRepo) : cartRepo;
      }),
    }),
  } as unknown as TenantDataSourceFactory;
}

describe('CartService', () => {
  const mockCart = { id: 'cart1', customerId: 'cust1', items: [] };

  describe('getCart', () => {
    it('returns existing cart', async () => {
      const cartRepo = { findOne: jest.fn().mockResolvedValue(mockCart) };
      const service = new CartService(makeFactory(cartRepo));

      const result = await service.getCart('tenant1', 'cust1');
      expect(result).toEqual(mockCart);
    });

    it('creates new cart if none exists', async () => {
      const newCart = { ...mockCart };
      const cartRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(() => newCart),
        save: jest.fn().mockResolvedValue(newCart),
      };
      const service = new CartService(makeFactory(cartRepo));

      const result = await service.getCart('tenant1', 'cust1');
      expect(cartRepo.save).toHaveBeenCalled();
      expect(result).toEqual(newCart);
    });
  });

  describe('addItem', () => {
    it('adds new item to cart', async () => {
      const cart = { ...mockCart, items: [] };
      const cartRepo = {
        findOne: jest.fn().mockResolvedValue(cart),
        save: jest.fn().mockResolvedValue(cart),
        create: jest.fn((d) => d),
      };
      const itemRepo = {
        create: jest.fn((d) => d),
        save: jest.fn().mockResolvedValue({}),
      };
      const service = new CartService(makeFactory(cartRepo, itemRepo));

      await service.addItem('tenant1', 'cust1', { productId: 'p1', quantity: 2 });
      expect(itemRepo.save).toHaveBeenCalled();
    });

    it('increments quantity for existing item', async () => {
      const existingItem = { productId: 'p1', quantity: 3 };
      const cart = { ...mockCart, items: [existingItem] };
      const cartRepo = {
        findOne: jest.fn().mockResolvedValue(cart),
        save: jest.fn().mockResolvedValue(cart),
        create: jest.fn((d) => d),
      };
      const itemRepo = { save: jest.fn().mockResolvedValue(existingItem) };
      const service = new CartService(makeFactory(cartRepo, itemRepo));

      await service.addItem('tenant1', 'cust1', { productId: 'p1', quantity: 2 });
      expect(existingItem.quantity).toBe(5);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', async () => {
      const item = { productId: 'p1', quantity: 1 };
      const cart = { ...mockCart, items: [item] };
      const cartRepo = {
        findOne: jest.fn().mockResolvedValue(cart),
      };
      const itemRepo = { remove: jest.fn().mockResolvedValue({}) };
      const service = new CartService(makeFactory(cartRepo, itemRepo));

      await service.removeItem('tenant1', 'cust1', 'p1');
      expect(itemRepo.remove).toHaveBeenCalledWith(item);
    });

    it('returns null when cart not found', async () => {
      const cartRepo = { findOne: jest.fn().mockResolvedValue(null) };
      const service = new CartService(makeFactory(cartRepo));

      const result = await service.removeItem('tenant1', 'cust1', 'p1');
      expect(result).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('removes all items from cart', async () => {
      const items = [{ productId: 'p1', quantity: 1 }, { productId: 'p2', quantity: 2 }];
      const cart = { ...mockCart, items };
      const cartRepo = { findOne: jest.fn().mockResolvedValue(cart) };
      const itemRepo = { remove: jest.fn().mockResolvedValue([]) };
      const service = new CartService(makeFactory(cartRepo, itemRepo));

      await service.clearCart('tenant1', 'cust1');
      expect(itemRepo.remove).toHaveBeenCalledWith(items);
    });
  });
});
