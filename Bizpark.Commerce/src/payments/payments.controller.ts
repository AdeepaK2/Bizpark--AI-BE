import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { PaymentsService } from './payments.service';

@Controller('api/commerce/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @TenantId() tenantId: string,
    @Body() dto: { customerId: string; amount: number; currency?: string },
  ) {
    return { success: true, data: this.paymentsService.createPaymentIntent(tenantId, dto) };
  }

  @Post('webhook')
  handleWebhook(@Body() event: unknown) {
    return this.paymentsService.processWebhook(event);
  }
}
