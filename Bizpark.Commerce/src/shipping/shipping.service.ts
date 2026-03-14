import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

type ShippingMethod = {
  id: string;
  tenantId: string;
  code: string;
  label: string;
  flatRate: number;
  currency: string;
  active: boolean;
};

@Injectable()
export class ShippingService {
  private readonly methodsByTenant = new Map<string, ShippingMethod[]>();

  listMethods(tenantId: string) {
    return this.methodsByTenant.get(tenantId) || [];
  }

  createMethod(
    tenantId: string,
    payload: { code: string; label: string; flatRate: number; currency?: string; active?: boolean },
  ) {
    const method: ShippingMethod = {
      id: randomUUID(),
      tenantId,
      code: payload.code,
      label: payload.label,
      flatRate: Number(payload.flatRate || 0),
      currency: payload.currency || 'USD',
      active: payload.active ?? true,
    };

    const existing = this.methodsByTenant.get(tenantId) || [];
    this.methodsByTenant.set(tenantId, [method, ...existing]);

    return method;
  }

  quote(
    tenantId: string,
    payload: { methodCode: string; weightKg?: number; orderSubtotal?: number },
  ) {
    const methods = this.methodsByTenant.get(tenantId) || [];
    const method = methods.find((item) => item.code === payload.methodCode && item.active);

    if (!method) {
      return {
        success: false,
        message: 'Shipping method not found',
      };
    }

    const weightFee = Math.max(0, Number(payload.weightKg || 0)) * 0.5;
    const subtotal = Math.max(0, Number(payload.orderSubtotal || 0));
    const discounted = subtotal >= 100 ? 5 : 0;
    const amount = Math.max(0, method.flatRate + weightFee - discounted);

    return {
      success: true,
      data: {
        methodCode: method.code,
        label: method.label,
        amount,
        currency: method.currency,
      },
    };
  }
}
