import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { NotificationsModule } from '../../modules/notifications/notifications.module';
import { PaymentsModule } from '../../modules/payments/payments.module';
import { EmailService } from '../services/email.service';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, NotificationsModule, PaymentsModule],
  providers: [SchedulerService, EmailService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
