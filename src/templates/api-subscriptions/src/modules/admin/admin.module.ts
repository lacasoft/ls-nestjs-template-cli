import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { AccountsModule } from '../accounts/accounts.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { RolesModule } from '../roles/roles.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    UsersModule,
    PlansModule,
    AccountsModule,
    SubscriptionsModule,
    SystemConfigModule,
    RolesModule,
    AuditModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
