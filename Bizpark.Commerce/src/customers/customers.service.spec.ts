import { CustomersService } from './customers.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';

function makeFactory(repo: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({ getRepository: jest.fn().mockReturnValue(repo) }),
  } as unknown as TenantDataSourceFactory;
}

describe('CustomersService', () => {
  const mockCustomer = { id: 'cust1', email: 'cust@test.com', name: 'Customer' };

  describe('list', () => {
    it('returns all customers', async () => {
      const repo = { find: jest.fn().mockResolvedValue([mockCustomer]) };
      const service = new CustomersService(makeFactory(repo));

      const result = await service.list('tenant1');
      expect(result).toEqual([mockCustomer]);
    });
  });

  describe('create', () => {
    it('creates a customer with normalized email', async () => {
      const repo = { create: jest.fn((d) => d), save: jest.fn((d) => Promise.resolve(d)) };
      const service = new CustomersService(makeFactory(repo));

      await service.create('tenant1', { email: 'UPPER@TEST.COM', name: 'Test' });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'upper@test.com' }));
    });

    it('sets name to null when not provided', async () => {
      const repo = { create: jest.fn((d) => d), save: jest.fn((d) => Promise.resolve(d)) };
      const service = new CustomersService(makeFactory(repo));

      await service.create('tenant1', { email: 'test@test.com' });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: null }));
    });
  });
});
