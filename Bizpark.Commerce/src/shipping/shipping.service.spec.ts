import { ShippingService } from './shipping.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';

function makeFactory(repo: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({ getRepository: jest.fn().mockReturnValue(repo) }),
  } as unknown as TenantDataSourceFactory;
}

describe('ShippingService', () => {
  const mockMethod = { id: 'sm1', code: 'STANDARD', label: 'Standard Delivery', flatRate: 5, currency: 'USD', active: true };

  describe('listMethods', () => {
    it('returns all shipping methods', async () => {
      const repo = { find: jest.fn().mockResolvedValue([mockMethod]) };
      const service = new ShippingService(makeFactory(repo));

      const result = await service.listMethods('tenant1');
      expect(result).toEqual([mockMethod]);
    });
  });

  describe('createMethod', () => {
    it('creates method with defaults', async () => {
      const repo = { create: jest.fn((d) => d), save: jest.fn((d) => Promise.resolve(d)) };
      const service = new ShippingService(makeFactory(repo));

      await service.createMethod('tenant1', { code: 'STD', label: 'Standard', flatRate: 5 });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        currency: 'USD',
        active: true,
      }));
    });
  });

  describe('quote', () => {
    it('returns shipping quote for active method', async () => {
      const repo = { findOne: jest.fn().mockResolvedValue(mockMethod) };
      const service = new ShippingService(makeFactory(repo));

      const result = await service.quote('tenant1', { methodCode: 'STANDARD', weightKg: 0, orderSubtotal: 50 });
      expect(result.success).toBe(true);
      expect((result as any).data.amount).toBe(5);
    });

    it('applies free shipping discount for orders over $100', async () => {
      const repo = { findOne: jest.fn().mockResolvedValue(mockMethod) };
      const service = new ShippingService(makeFactory(repo));

      const result = await service.quote('tenant1', { methodCode: 'STANDARD', weightKg: 0, orderSubtotal: 150 });
      expect((result as any).data.amount).toBe(0);
    });

    it('adds weight fee to shipping amount', async () => {
      const repo = { findOne: jest.fn().mockResolvedValue(mockMethod) };
      const service = new ShippingService(makeFactory(repo));

      const result = await service.quote('tenant1', { methodCode: 'STANDARD', weightKg: 2, orderSubtotal: 50 });
      expect((result as any).data.amount).toBe(6);
    });

    it('returns failure when method not found', async () => {
      const repo = { findOne: jest.fn().mockResolvedValue(null) };
      const service = new ShippingService(makeFactory(repo));

      const result = await service.quote('tenant1', { methodCode: 'UNKNOWN' });
      expect(result.success).toBe(false);
    });
  });
});
