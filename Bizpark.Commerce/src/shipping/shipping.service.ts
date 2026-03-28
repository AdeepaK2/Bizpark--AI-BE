import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { ShippingMethodEntity } from '../db/entities';

@Injectable()
export class ShippingService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async listMethods(tenantId: string) {
    const repo = await this.repo(tenantId);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  async createMethod(
    tenantId: string,
    payload: { code: string; label: string; flatRate: number; currency?: string; active?: boolean },
  ) {
    const repo = await this.repo(tenantId);
    const method = repo.create({
      code: payload.code,
      label: payload.label,
      flatRate: Number(payload.flatRate || 0),
      currency: payload.currency || 'USD',
      active: payload.active ?? true,
    });
    return repo.save(method);
  }

  async updateMethod(
    tenantId: string,
    id: string,
    payload: { label?: string; flatRate?: number; currency?: string; active?: boolean },
  ) {
    const repo = await this.repo(tenantId);
    const method = await repo.findOne({ where: { id } });
    if (!method) throw new NotFoundException('Shipping method not found');

    if (payload.label !== undefined) method.label = payload.label;
    if (payload.flatRate !== undefined) method.flatRate = Number(payload.flatRate);
    if (payload.currency !== undefined) method.currency = payload.currency;
    if (payload.active !== undefined) method.active = payload.active;

    return repo.save(method);
  }

  async deleteMethod(tenantId: string, id: string) {
    const repo = await this.repo(tenantId);
    const method = await repo.findOne({ where: { id } });
    if (!method) throw new NotFoundException('Shipping method not found');
    await repo.remove(method);
    return { deleted: true, id };
  }

  async quote(
    tenantId: string,
    payload: { methodCode: string; weightKg?: number; orderSubtotal?: number },
  ) {
    const repo = await this.repo(tenantId);
    const method = await repo.findOne({ where: { code: payload.methodCode, active: true } });

    if (!method) return { success: false, message: 'Shipping method not found' };

    const weightFee = Math.max(0, Number(payload.weightKg || 0)) * 0.5;
    const subtotal = Math.max(0, Number(payload.orderSubtotal || 0));
    const discounted = subtotal >= 100 ? 5 : 0;
    const amount = Math.max(0, Number(method.flatRate) + weightFee - discounted);

    return {
      success: true,
      data: { methodCode: method.code, label: method.label, amount, currency: method.currency },
    };
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(ShippingMethodEntity);
  }
}
