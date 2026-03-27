import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [CartModule, OrdersModule, InventoryModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
