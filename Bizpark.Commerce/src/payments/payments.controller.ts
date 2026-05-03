import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dtos';

@ApiTags('Payments')
@ApiSecurity('TenantId')
@Controller('api/commerce/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create payment intent', description: 'Returns a payment intent for client-side payment processing.' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 201, description: 'Payment intent object' })
  @Post('intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @TenantId() tenantId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return { success: true, data: this.paymentsService.createPaymentIntent(tenantId, dto) };
  }

  @ApiOperation({ summary: 'Payment webhook', description: 'Receives events from your payment provider (Stripe, etc.).' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @Post('webhook')
  async handleWebhook(@TenantId() tenantId: string, @Body() event: unknown) {
    return this.paymentsService.processWebhook(tenantId, event);
  }
}
