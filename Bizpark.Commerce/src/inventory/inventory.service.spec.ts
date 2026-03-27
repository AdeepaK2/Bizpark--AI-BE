import { InventoryService } from './inventory.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';

function makeFactory(repo: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({ getRepository: jest.fn().mockReturnValue(repo) }),
  } as unknown as TenantDataSourceFactory;
}

describe('InventoryService', () => {
  const mockItem = { id: 'inv1', productId: 'p1', sku: 'SKU-001', availableQuantity: 100, reservedQuantity: 0 };

  describe('list', () => {
    it('returns all inventory items', async () => {
      const repo = { find: jest.fn().mockResolvedValue([mockItem]) };
      const service = new InventoryService(makeFactory(repo));

      const result = await service.list('tenant1');
      expect(result).toEqual([mockItem]);
    });
  });

  describe('upsert', () => {
    it('creates new inventory item when SKU does not exist', async () => {
      const repo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((d) => d),
        save: jest.fn((d) => Promise.resolve({ ...d, id: 'inv1' })),
      };
      const service = new InventoryService(makeFactory(repo));

      const result = await service.upsert('tenant1', { productId: 'p1', sku: 'SKU-001', availableQuantity: 50 });
      expect(repo.create).toHaveBeenCalled();
      expect(result.availableQuantity).toBe(50);
    });

    it('updates existing inventory item when SKU exists', async () => {
      const existing = { ...mockItem };
      const repo = {
        findOne: jest.fn().mockResolvedValue(existing),
        save: jest.fn((d) => Promise.resolve(d)),
      };
      const service = new InventoryService(makeFactory(repo));

      await service.upsert('tenant1', { productId: 'p1', sku: 'SKU-001', availableQuantity: 200 });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ availableQuantity: 200 }));
    });

    it('clamps negative availableQuantity to 0', async () => {
      const repo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((d) => d),
        save: jest.fn((d) => Promise.resolve(d)),
      };
      const service = new InventoryService(makeFactory(repo));

      await service.upsert('tenant1', { productId: 'p1', sku: 'SKU-001', availableQuantity: -5 });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ availableQuantity: 0 }));
    });
  });

  describe('reserve', () => {
    it('reserves stock when sufficient quantity available', async () => {
      const item = { ...mockItem, availableQuantity: 10, reservedQuantity: 0 };
      const repo = {
        findOne: jest.fn().mockResolvedValue(item),
        save: jest.fn((d) => Promise.resolve(d)),
      };
      const service = new InventoryService(makeFactory(repo));

      const result = await service.reserve('tenant1', { sku: 'SKU-001', quantity: 3 });
      expect(result.success).toBe(true);
      expect(item.availableQuantity).toBe(7);
      expect(item.reservedQuantity).toBe(3);
    });

    it('returns failure when insufficient stock', async () => {
      const item = { ...mockItem, availableQuantity: 2 };
      const repo = { findOne: jest.fn().mockResolvedValue(item), save: jest.fn() };
      const service = new InventoryService(makeFactory(repo));

      const result = await service.reserve('tenant1', { sku: 'SKU-001', quantity: 5 });
      expect(result.success).toBe(false);
    });

    it('returns failure when SKU not found', async () => {
      const repo = { findOne: jest.fn().mockResolvedValue(null) };
      const service = new InventoryService(makeFactory(repo));

      const result = await service.reserve('tenant1', { sku: 'UNKNOWN', quantity: 1 });
      expect(result.success).toBe(false);
    });
  });
});
