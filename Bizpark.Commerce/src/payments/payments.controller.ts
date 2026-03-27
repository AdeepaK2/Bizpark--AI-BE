import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dtos';

@Controller('api/commerce/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @TenantId() tenantId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return { success: true, data: this.paymentsService.createPaymentIntent(tenantId, dto) };
  }

  @Post('webhook')
  async handleWebhook(@TenantId() tenantId: string, @Body() event: unknown) {
    return this.paymentsService.processWebhook(tenantId, event);
  }
}
