import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DataSource, LessThan, Between } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../../modules/subscriptions/entities/subscription.entity';
import {
  Transaction,
  TransactionStatus,
  PaymentMethod,
} from '../../modules/payments/entities/transaction.entity';
import {
  NotificationType,
  NotificationChannel,
} from '../../modules/notifications/entities/notification.entity';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { EmailService } from '../services/email.service';
import { RecurringPaymentsService } from '../../modules/payments/services/recurring-payments.service';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private recurringPaymentsService: RecurringPaymentsService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    this.setupCronJobs();
  }

  private setupCronJobs() {
    // Check expiring trials
    const checkExpiringTrialsCron = this.configService.get<string>(
      'CRON_CHECK_EXPIRING_TRIALS',
      '0 0 * * *',
    );
    const checkExpiringTrialsJob = new CronJob(checkExpiringTrialsCron, () => {
      this.checkExpiringTrials();
    });
    this.schedulerRegistry.addCronJob('check_expiring_trials', checkExpiringTrialsJob);
    checkExpiringTrialsJob.start();
    this.logger.log(`Cron job 'check_expiring_trials' scheduled: ${checkExpiringTrialsCron}`);

    // Process renewals
    const processRenewalsCron = this.configService.get<string>(
      'CRON_PROCESS_RENEWALS',
      '0 1 * * *',
    );
    const processRenewalsJob = new CronJob(processRenewalsCron, () => {
      this.processRenewals();
    });
    this.schedulerRegistry.addCronJob('process_renewals', processRenewalsJob);
    processRenewalsJob.start();
    this.logger.log(`Cron job 'process_renewals' scheduled: ${processRenewalsCron}`);

    // Activate scheduled periods
    const activateScheduledPeriodsCron = this.configService.get<string>(
      'CRON_ACTIVATE_SCHEDULED_PERIODS',
      '0 2 * * *',
    );
    const activateScheduledPeriodsJob = new CronJob(activateScheduledPeriodsCron, () => {
      this.activateScheduledPeriods();
    });
    this.schedulerRegistry.addCronJob('activate_scheduled_periods', activateScheduledPeriodsJob);
    activateScheduledPeriodsJob.start();
    this.logger.log(
      `Cron job 'activate_scheduled_periods' scheduled: ${activateScheduledPeriodsCron}`,
    );

    // Cleanup expired invitations
    const cleanupExpiredInvitationsCron = this.configService.get<string>(
      'CRON_CLEANUP_EXPIRED_INVITATIONS',
      '0 3 * * *',
    );
    const cleanupExpiredInvitationsJob = new CronJob(cleanupExpiredInvitationsCron, () => {
      this.cleanupExpiredInvitations();
    });
    this.schedulerRegistry.addCronJob('cleanup_expired_invitations', cleanupExpiredInvitationsJob);
    cleanupExpiredInvitationsJob.start();
    this.logger.log(
      `Cron job 'cleanup_expired_invitations' scheduled: ${cleanupExpiredInvitationsCron}`,
    );

    // Remind pending approvals
    const remindPendingApprovalsCron = this.configService.get<string>(
      'CRON_REMIND_PENDING_APPROVALS',
      '0 10 * * *',
    );
    const remindPendingApprovalsJob = new CronJob(remindPendingApprovalsCron, () => {
      this.remindPendingApprovals();
    });
    this.schedulerRegistry.addCronJob('remind_pending_approvals', remindPendingApprovalsJob);
    remindPendingApprovalsJob.start();
    this.logger.log(`Cron job 'remind_pending_approvals' scheduled: ${remindPendingApprovalsCron}`);

    // Retry failed payments
    const retryFailedPaymentsCron = this.configService.get<string>(
      'CRON_RETRY_FAILED_PAYMENTS',
      '0 */6 * * *',
    );
    const retryFailedPaymentsJob = new CronJob(retryFailedPaymentsCron, () => {
      this.retryFailedPayments();
    });
    this.schedulerRegistry.addCronJob('retry_failed_payments', retryFailedPaymentsJob);
    retryFailedPaymentsJob.start();
    this.logger.log(`Cron job 'retry_failed_payments' scheduled: ${retryFailedPaymentsCron}`);
  }

  /**
   * Check for expiring trials and notify users
   * Default: Daily at 00:00 (midnight)
   */
  async checkExpiringTrials() {
    this.logger.log('Running check_expiring_trials cron job');

    try {
      const subscriptionRepo = this.dataSource.getRepository(Subscription);
      const userRepo = this.dataSource.getRepository(User);

      // Find trials expiring in 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(0, 0, 0, 0);

      const fourDaysFromNow = new Date();
      fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
      fourDaysFromNow.setHours(0, 0, 0, 0);

      const expiringTrials = await subscriptionRepo.find({
        where: {
          status: SubscriptionStatus.TRIAL,
          trialEndsAt: Between(threeDaysFromNow, fourDaysFromNow),
        },
        relations: ['account', 'account.users', 'plan'],
      });

      this.logger.log(`Found ${expiringTrials.length} expiring trials`);

      for (const subscription of expiringTrials) {
        // Find the account owner (first user with OWNER role in the account)
        const owner = await userRepo.findOne({
          where: { accountId: subscription.accountId },
          relations: ['role'],
        });

        if (!owner) continue;

        const daysRemaining = Math.ceil(
          (subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        // Check user notification preferences
        const { enabled, channels } = await this.notificationsService.shouldNotify(
          owner.id,
          NotificationType.TRIAL_EXPIRING,
        );

        if (!enabled) continue;

        // Create in-app notification
        await this.notificationsService.createNotification(
          owner.id,
          NotificationType.TRIAL_EXPIRING,
          'Your trial is expiring soon',
          `Your trial for ${subscription.plan.name} expires in ${daysRemaining} days. Upgrade now to continue enjoying all features.`,
          { subscriptionId: subscription.id, daysRemaining },
          `/subscriptions/${subscription.id}`,
          channels,
        );

        // Send email notification if enabled
        if (channels.includes(NotificationChannel.EMAIL)) {
          await this.emailService.sendSubscriptionExpiringEmail(
            owner.email,
            `${owner.firstName} ${owner.lastName}`,
            subscription.plan.name,
            daysRemaining,
          );
        }
      }

      this.logger.log('Completed check_expiring_trials cron job');
    } catch (error) {
      this.logger.error('Error in check_expiring_trials cron job', error);
    }
  }

  /**
   * Process subscription renewals
   * Default: Daily at 01:00
   */
  async processRenewals() {
    this.logger.log('Running process_renewals cron job');

    try {
      const subscriptionRepo = this.dataSource.getRepository(Subscription);

      // Find subscriptions where nextBillingDate is today or past
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const subscriptionsToRenew = await subscriptionRepo.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: LessThan(today),
          autoRenew: true,
        },
        relations: ['account', 'plan'],
        take: 100, // Process 100 at a time to avoid memory issues
      });

      this.logger.log(`Found ${subscriptionsToRenew.length} subscriptions to renew`);

      // Process renewals
      let successCount = 0;
      let failureCount = 0;

      for (const subscription of subscriptionsToRenew) {
        try {
          const result =
            await this.recurringPaymentsService.processSubscriptionRenewal(subscription);

          if (result.success) {
            successCount++;
            this.logger.log(`✓ Successfully renewed subscription ${subscription.id}`);
          } else {
            failureCount++;
            this.logger.warn(
              `✗ Failed to renew subscription ${subscription.id}: ${result.message}`,
            );
          }

          // Add delay between API calls to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          failureCount++;
          this.logger.error(`Error processing renewal for subscription ${subscription.id}`, error);
        }
      }

      this.logger.log(
        `Completed process_renewals: ${successCount} successful, ${failureCount} failed out of ${subscriptionsToRenew.length} total`,
      );
    } catch (error) {
      this.logger.error('Error in process_renewals cron job', error);
    }
  }

  /**
   * Activate scheduled subscriptions
   * Default: Daily at 02:00
   */
  async activateScheduledPeriods() {
    this.logger.log('Running activate_scheduled_periods cron job');

    try {
      const subscriptionRepo = this.dataSource.getRepository(Subscription);
      const userRepo = this.dataSource.getRepository(User);

      // Find subscriptions that should start today
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const scheduledSubscriptions = await subscriptionRepo.find({
        where: {
          status: SubscriptionStatus.SUSPENDED,
          startsAt: LessThan(today),
        },
        relations: ['account', 'account.users', 'plan'],
      });

      this.logger.log(`Found ${scheduledSubscriptions.length} scheduled subscriptions to activate`);

      for (const subscription of scheduledSubscriptions) {
        try {
          subscription.status = SubscriptionStatus.ACTIVE;
          await subscriptionRepo.save(subscription);

          const owner = await userRepo.findOne({
            where: { accountId: subscription.accountId },
          });

          if (owner) {
            await this.notificationsService.createNotification(
              owner.id,
              NotificationType.SUBSCRIPTION_ACTIVATED,
              'Subscription activated',
              `Your subscription for ${subscription.plan.name} is now active.`,
              { subscriptionId: subscription.id },
              `/subscriptions/${subscription.id}`,
            );
          }

          this.logger.log(`Activated subscription ${subscription.id}`);
        } catch (error) {
          this.logger.error(`Error activating subscription ${subscription.id}`, error);
        }
      }

      this.logger.log('Completed activate_scheduled_periods cron job');
    } catch (error) {
      this.logger.error('Error in activate_scheduled_periods cron job', error);
    }
  }

  /**
   * Cleanup expired invitations
   * Default: Daily at 03:00
   */
  async cleanupExpiredInvitations() {
    this.logger.log('Running cleanup_expired_invitations cron job');

    try {
      // This would clean up expired invitations if the invitation entity exists
      // For now, we'll just log a message
      this.logger.log('Invitation cleanup not yet implemented - entity not found');

      this.logger.log('Completed cleanup_expired_invitations cron job');
    } catch (error) {
      this.logger.error('Error in cleanup_expired_invitations cron job', error);
    }
  }

  /**
   * Remind admins about pending bank transfer approvals
   * Default: Daily at 10:00
   */
  async remindPendingApprovals() {
    this.logger.log('Running remind_pending_approvals cron job');

    try {
      const transactionRepo = this.dataSource.getRepository(Transaction);

      // Find pending bank transfers older than 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const pendingTransactions = await transactionRepo.find({
        where: {
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          createdAt: LessThan(twentyFourHoursAgo),
        },
        relations: ['user', 'subscription', 'subscription.plan'],
      });

      this.logger.log(`Found ${pendingTransactions.length} pending bank transfers`);

      if (pendingTransactions.length > 0) {
        // Log a message about pending approvals
        this.logger.log(
          `There are ${pendingTransactions.length} bank transfers pending approval for more than 24 hours`,
        );

        // You could also send an email to admins
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
        if (adminEmail) {
          this.logger.log(`Would send reminder email to admin: ${adminEmail}`);
        }
      }

      this.logger.log('Completed remind_pending_approvals cron job');
    } catch (error) {
      this.logger.error('Error in remind_pending_approvals cron job', error);
    }
  }

  /**
   * Retry failed recurring payments
   * Default: Every 6 hours
   */
  async retryFailedPayments() {
    this.logger.log('Running retry_failed_payments cron job');

    try {
      await this.recurringPaymentsService.retryFailedPayments();
      this.logger.log('Completed retry_failed_payments cron job');
    } catch (error) {
      this.logger.error('Error in retry_failed_payments cron job', error);
    }
  }
}
