import { CatalogService } from './catalog.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';

function makeFactory(repo: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({ getRepository: jest.fn().mockReturnValue(repo) }),
  } as unknown as TenantDataSourceFactory;
}

describe('CatalogService', () => {
  const mockProduct = { id: 'p1', title: 'Cake', description: 'Yum', price: 10.5, currency: 'USD' };

  describe('listProducts', () => {
    it('returns all products sorted by createdAt DESC', async () => {
      const repo = { find: jest.fn().mockResolvedValue([mockProduct]) };
      const service = new CatalogService(makeFactory(repo));

      const result = await service.listProducts('tenant1');
      expect(result).toEqual([mockProduct]);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('returns empty array when no products', async () => {
      const repo = { find: jest.fn().mockResolvedValue([]) };
      const service = new CatalogService(makeFactory(repo));

      const result = await service.listProducts('tenant1');
      expect(result).toEqual([]);
    });
  });

  describe('createProduct', () => {
    it('creates product with all fields', async () => {
      const repo = { create: jest.fn((d) => d), save: jest.fn().mockResolvedValue(mockProduct) };
      const service = new CatalogService(makeFactory(repo));

      const result = await service.createProduct('tenant1', { title: 'Cake', price: 10.5, currency: 'USD' });
      expect(result).toEqual(mockProduct);
    });

    it('defaults currency to USD when not provided', async () => {
      const repo = { create: jest.fn((d) => d), save: jest.fn((d) => Promise.resolve(d)) };
      const service = new CatalogService(makeFactory(repo));

      await service.createProduct('tenant1', { title: 'Cake', price: 5 });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ currency: 'USD' }));
    });

    it('sets description to null when not provided', async () => {
      const repo = { create: jest.fn((d) => d), save: jest.fn((d) => Promise.resolve(d)) };
      const service = new CatalogService(makeFactory(repo));

      await service.createProduct('tenant1', { title: 'Cake', price: 5 });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
    });
  });
});
