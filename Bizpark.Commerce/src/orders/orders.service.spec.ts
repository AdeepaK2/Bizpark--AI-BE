import { OrdersService } from './orders.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { InventoryService } from '../inventory/inventory.service';

function makeFactory(orderRepo: any, itemRepo: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({
      getRepository: jest.fn((entity) => {
        const name = entity?.name ?? '';
        return name === 'OrderItemEntity' ? itemRepo : orderRepo;
      }),
    }),
  } as unknown as TenantDataSourceFactory;
}

function makeInventoryService(): InventoryService {
  return {
    releaseByProductId: jest.fn().mockResolvedValue(undefined),
    reserveByProductId: jest.fn().mockResolvedValue({ success: true }),
  } as unknown as InventoryService;
}

describe('OrdersService', () => {
  const mockOrder = { id: 'ord1', customerId: 'cust1', status: 'PENDING', items: [] };

  describe('list', () => {
    it('returns all orders sorted by createdAt DESC', async () => {
      const orderRepo = { find: jest.fn().mockResolvedValue([mockOrder]) };
      const service = new OrdersService(makeFactory(orderRepo, {}), makeInventoryService());

      const result = await service.list('tenant1');
      expect(result).toEqual([mockOrder]);
      expect(orderRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('create', () => {
    it('creates an order with PENDING status', async () => {
      const savedOrder = { ...mockOrder, id: 'ord1' };
      const orderRepo = {
        create: jest.fn((d) => d),
        save: jest.fn().mockResolvedValue(savedOrder),
        findOne: jest.fn().mockResolvedValue(savedOrder),
      };
      const itemRepo = {
        create: jest.fn((d) => d),
        save: jest.fn().mockResolvedValue([]),
      };
      const service = new OrdersService(makeFactory(orderRepo, itemRepo), makeInventoryService());

      const result = await service.create('tenant1', {
        customerId: 'cust1',
        items: [{ productId: 'p1', quantity: 2 }],
      });
      expect(orderRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }));
      expect(result).toEqual(savedOrder);
    });

    it('creates order items from payload', async () => {
      const savedOrder = { ...mockOrder };
      const orderRepo = {
        create: jest.fn((d) => d),
        save: jest.fn().mockResolvedValue(savedOrder),
        findOne: jest.fn().mockResolvedValue(savedOrder),
      };
      const itemRepo = {
        create: jest.fn((d) => d),
        save: jest.fn().mockResolvedValue([]),
      };
      const service = new OrdersService(makeFactory(orderRepo, itemRepo), makeInventoryService());

      await service.create('tenant1', {
        customerId: 'cust1',
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ],
      });
      expect(itemRepo.create).toHaveBeenCalledTimes(2);
    });
  });
});
