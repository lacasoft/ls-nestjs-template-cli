import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { PaymentPeriodRepository } from './repositories/payment-period.repository';
import { Subscription } from './entities/subscription.entity';
import { PaymentPeriod } from './entities/payment-period.entity';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { LocationsModule } from '../locations/locations.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, PaymentPeriod]),
    UsersModule,
    PlansModule,
    forwardRef(() => LocationsModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionRepository, PaymentPeriodRepository],
  exports: [SubscriptionsService, SubscriptionRepository, PaymentPeriodRepository],
})
export class SubscriptionsModule {}
