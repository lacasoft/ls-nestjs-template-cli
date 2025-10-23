import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { CurrencyController } from './controllers/currency.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { PaymentsService } from './services/payments.service';
import { StripeService } from './services/stripe.service';
import { PayPalService } from './services/paypal.service';
import { CurrencyService } from './services/currency.service';
import { RecurringPaymentsService } from './services/recurring-payments.service';
import { InvoiceService } from './services/invoice.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { CurrencyRepository } from './repositories/currency.repository';
import { InvoiceRepository } from './repositories/invoice.repository';
import { Transaction } from './entities/transaction.entity';
import { Currency } from './entities/currency.entity';
import { Invoice } from './entities/invoice.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Currency, Invoice]),
    ConfigModule,
    forwardRef(() => SubscriptionsModule),
    UsersModule,
    PlansModule,
  ],
  controllers: [PaymentsController, CurrencyController, InvoiceController],
  providers: [
    PaymentsService,
    StripeService,
    PayPalService,
    CurrencyService,
    RecurringPaymentsService,
    InvoiceService,
    TransactionRepository,
    CurrencyRepository,
    InvoiceRepository,
    EmailService,
  ],
  exports: [
    PaymentsService,
    StripeService,
    PayPalService,
    CurrencyService,
    RecurringPaymentsService,
    InvoiceService,
    TransactionRepository,
    CurrencyRepository,
    InvoiceRepository,
  ],
})
export class PaymentsModule {}
