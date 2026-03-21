import { Injectable } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { OrderEntity, OrderItemEntity } from '../db/entities';

type OrderItemInput = { productId: string; quantity: number };

@Injectable()
export class OrdersService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(tenantId: string, payload: { customerId: string; items: OrderItemInput[] }) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    const orderRepo = ds.getRepository(OrderEntity);
    const itemRepo = ds.getRepository(OrderItemEntity);

    const order = await orderRepo.save(
      orderRepo.create({ customerId: payload.customerId, status: 'PENDING', items: [] }),
    );

    const items = payload.items.map((i) =>
      itemRepo.create({ productId: i.productId, quantity: i.quantity, order }),
    );
    await itemRepo.save(items);

    return orderRepo.findOne({ where: { id: order.id } });
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(OrderEntity);
  }
}
