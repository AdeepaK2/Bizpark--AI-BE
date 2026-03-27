import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';

function makeOrdersService(): OrdersService {
  return {
    updateStatus: jest.fn().mockResolvedValue({}),
  } as unknown as OrdersService;
}

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService(makeOrdersService());
  });

  describe('createPaymentIntent', () => {
    it('returns a payment intent with correct shape', () => {
      const result = service.createPaymentIntent('tenant1', { customerId: 'cust1', amount: 50 });
      expect(result.id).toBeDefined();
      expect(result.status).toBe('REQUIRES_CONFIRMATION');
      expect(result.provider).toBe('STRIPE');
      expect(result.tenantId).toBe('tenant1');
      expect(result.customerId).toBe('cust1');
      expect(result.amount).toBe(50);
    });

    it('defaults currency to USD', () => {
      const result = service.createPaymentIntent('tenant1', { customerId: 'c1', amount: 20 });
      expect(result.currency).toBe('USD');
    });

    it('uses provided currency', () => {
      const result = service.createPaymentIntent('tenant1', { customerId: 'c1', amount: 20, currency: 'LKR' });
      expect(result.currency).toBe('LKR');
    });

    it('generates unique IDs per call', () => {
      const r1 = service.createPaymentIntent('t1', { customerId: 'c1', amount: 10 });
      const r2 = service.createPaymentIntent('t1', { customerId: 'c1', amount: 10 });
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('processWebhook', () => {
    it('returns accepted with event echoed back', async () => {
      const event = { type: 'payment.succeeded', data: { id: 'pi_1' } };
      const result = await service.processWebhook('tenant1', event);
      expect(result.accepted).toBe(true);
      expect(result.event).toEqual(event);
      expect(result.receivedAt).toBeDefined();
    });

    it('updates order to PAID on payment_intent.succeeded', async () => {
      const ordersService = makeOrdersService();
      service = new PaymentsService(ordersService);
      const event = {
        type: 'payment_intent.succeeded',
        data: { object: { metadata: { orderId: 'ord-123' } } },
      };
      await service.processWebhook('tenant1', event);
      expect(ordersService.updateStatus).toHaveBeenCalledWith('tenant1', 'ord-123', 'PAID');
    });
  });
});
