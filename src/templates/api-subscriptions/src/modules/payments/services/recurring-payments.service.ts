import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';
import {
  Transaction,
  TransactionStatus,
  PaymentMethod,
  TransactionType,
} from '../entities/transaction.entity';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';
import { InvoiceService } from './invoice.service';
import { EmailService } from '../../../common/services/email.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RecurringPaymentsService {
  private readonly logger = new Logger(RecurringPaymentsService.name);

  constructor(
    private dataSource: DataSource,
    private stripeService: StripeService,
    private paypalService: PayPalService,
    private invoiceService: InvoiceService,
    private emailService: EmailService,
    private transactionRepository: TransactionRepository,
    private configService: ConfigService,
  ) {}

  /**
   * Process a single subscription renewal
   */
  async processSubscriptionRenewal(subscription: Subscription): Promise<{
    success: boolean;
    message: string;
    transaction?: Transaction;
  }> {
    this.logger.log(`Processing renewal for subscription ${subscription.id}`);

    try {
      // Get the account owner/user
      const userRepo = this.dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { accountId: subscription.accountId, isAccountOwner: true },
      });

      if (!user) {
        throw new Error('Account owner not found');
      }

      // Get the last successful transaction to determine payment method
      const lastTransaction = await this.transactionRepository.findOne({
        where: {
          subscriptionId: subscription.id,
          status: TransactionStatus.SUCCEEDED,
        },
        order: { createdAt: 'DESC' },
      });

      if (!lastTransaction) {
        this.logger.warn(
          `No previous successful transaction found for subscription ${subscription.id}`,
        );
        return {
          success: false,
          message: 'No payment method on file. Manual payment required.',
        };
      }

      const amount = Number(subscription.plan.price);
      const currency =
        subscription.plan.currency || this.configService.get('DEFAULT_CURRENCY', 'MXN');

      // Process payment based on original payment method
      let paymentResult: any;
      // newTransaction will be created below

      switch (lastTransaction.paymentMethod) {
        case PaymentMethod.STRIPE:
          paymentResult = await this.processStripeRecurring(
            subscription,
            user,
            amount,
            currency,
            lastTransaction,
          );
          break;

        case PaymentMethod.PAYPAL:
          paymentResult = await this.processPayPalRecurring(
            subscription,
            user,
            amount,
            currency,
            lastTransaction,
          );
          break;

        case PaymentMethod.BANK_TRANSFER:
          // Bank transfers can't be auto-renewed, notify user
          this.logger.log(`Subscription ${subscription.id} uses bank transfer, cannot auto-renew`);
          await this.emailService.sendSubscriptionExpiringEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            subscription.plan.name,
            0, // 0 days = today
          );
          return {
            success: false,
            message: 'Bank transfer subscriptions require manual renewal',
          };

        default:
          throw new Error(`Unsupported payment method: ${lastTransaction.paymentMethod}`);
      }

      // Create transaction record
      const newTransaction = this.transactionRepository.create({
        userId: user.id,
        subscriptionId: subscription.id,
        accountId: subscription.accountId,
        amount,
        currency,
        paymentMethod: lastTransaction.paymentMethod,
        status: TransactionStatus.SUCCEEDED,
        transactionType: TransactionType.SUBSCRIPTION_RENEWAL,
        description: `Recurring payment for ${subscription.plan.name}`,
        stripePaymentIntentId: paymentResult.stripePaymentIntentId,
        paypalOrderId: paymentResult.paypalOrderId,
        paypalCaptureId: paymentResult.paypalCaptureId,
        metadata: {
          renewalDate: new Date(),
          previousTransactionId: lastTransaction.id,
          automatic: true,
        },
      });

      await this.transactionRepository.save(newTransaction);

      // Update subscription billing date
      const nextBillingDate = new Date(subscription.nextBillingDate);
      switch (subscription.plan.interval) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + subscription.plan.intervalCount);
          break;
        case 'yearly':
          nextBillingDate.setFullYear(
            nextBillingDate.getFullYear() + subscription.plan.intervalCount,
          );
          break;
        case 'quarterly':
          nextBillingDate.setMonth(
            nextBillingDate.getMonth() + 3 * subscription.plan.intervalCount,
          );
          break;
      }

      subscription.nextBillingDate = nextBillingDate;
      await this.dataSource.getRepository(Subscription).save(subscription);

      // Send success email
      await this.emailService.sendPaymentSuccessEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        amount,
        subscription.plan.name,
      );

      // Generate invoice and send via email
      try {
        const invoice = await this.invoiceService.createInvoiceForTransaction(newTransaction, user);
        await this.invoiceService.generatePDF(invoice.id);
        await this.invoiceService.sendInvoiceEmail(invoice.id);
        this.logger.log(
          `Invoice ${invoice.invoiceNumber} generated and sent for recurring payment ${newTransaction.id}`,
        );
      } catch (error) {
        this.logger.error('Failed to generate or send invoice for recurring payment', error);
        // Don't throw error - invoice generation failure shouldn't fail the payment
      }

      this.logger.log(`Successfully processed renewal for subscription ${subscription.id}`);

      return {
        success: true,
        message: 'Renewal processed successfully',
        transaction: newTransaction,
      };
    } catch (error) {
      this.logger.error(`Error processing renewal for subscription ${subscription.id}`, error);

      // Handle failed payment
      await this.handleFailedPayment(subscription, error.message);

      return {
        success: false,
        message: `Payment failed: ${error.message}`,
      };
    }
  }

  /**
   * Process Stripe recurring payment
   */
  private async processStripeRecurring(
    subscription: Subscription,
    user: User,
    amount: number,
    currency: string,
    lastTransaction: Transaction,
  ): Promise<any> {
    // For Stripe, we would typically use their Subscriptions API
    // For now, we'll create a new payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      Math.round(amount * 100), // Convert to cents
      currency.toLowerCase(),
      {
        subscriptionId: subscription.id,
        userId: user.id,
        type: 'recurring',
        description: `Recurring payment for ${subscription.plan.name}`,
        customerId: lastTransaction.metadata?.stripeCustomerId,
        paymentMethodId: lastTransaction.metadata?.stripePaymentMethodId,
      },
      lastTransaction.metadata?.stripeCustomerId,
    );

    return {
      stripePaymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Process PayPal recurring payment
   */
  private async processPayPalRecurring(
    subscription: Subscription,
    user: User,
    amount: number,
    currency: string,
    _lastTransaction: Transaction,
  ): Promise<any> {
    // For PayPal, we would typically use their Billing Plans & Subscriptions API
    // For now, we'll create a new order
    const order = await this.paypalService.createOrder(
      amount,
      currency.toUpperCase(),
      `Recurring payment for ${subscription.plan.name}`,
      {
        subscriptionId: subscription.id,
        userId: user.id,
        type: 'recurring',
      },
    );

    // Note: In production, you'd need to handle PayPal's approval flow differently for recurring payments
    // This is a simplified version
    return {
      paypalOrderId: order.orderId,
      paypalCaptureId: order.orderId, // Simplified
    };
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(subscription: Subscription, reason: string): Promise<void> {
    this.logger.warn(`Payment failed for subscription ${subscription.id}: ${reason}`);

    // Get user
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { accountId: subscription.accountId, isAccountOwner: true },
    });

    if (!user) return;

    // Update subscription metadata with failure info
    subscription.metadata = {
      ...subscription.metadata,
      lastFailedPayment: {
        date: new Date(),
        reason,
        attempts: (subscription.metadata?.lastFailedPayment?.attempts || 0) + 1,
      },
    };

    const subscriptionRepo = this.dataSource.getRepository(Subscription);

    // If this is the 3rd failed attempt, suspend the subscription
    const attempts = subscription.metadata.lastFailedPayment.attempts;
    if (attempts >= 3) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      this.logger.warn(
        `Subscription ${subscription.id} marked as PAST_DUE after ${attempts} failed attempts`,
      );

      // Send critical email
      await this.emailService.sendPaymentSuccessEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        0,
        subscription.plan.name,
      ); // TODO: Create specific email template for payment failures
    }

    await subscriptionRepo.save(subscription);
  }

  /**
   * Retry failed payments
   */
  async retryFailedPayments(): Promise<void> {
    this.logger.log('Retrying failed payments');

    const subscriptionRepo = this.dataSource.getRepository(Subscription);

    // Find subscriptions that are past due
    const pastDueSubscriptions = await subscriptionRepo.find({
      where: { status: SubscriptionStatus.PAST_DUE },
      relations: ['plan', 'account'],
      take: 50, // Process 50 at a time
    });

    this.logger.log(`Found ${pastDueSubscriptions.length} past due subscriptions to retry`);

    for (const subscription of pastDueSubscriptions) {
      const attempts = subscription.metadata?.lastFailedPayment?.attempts || 0;

      // Don't retry more than 5 times
      if (attempts > 5) {
        this.logger.log(
          `Skipping subscription ${subscription.id} - too many failed attempts (${attempts})`,
        );
        continue;
      }

      // Wait 24 hours between retries
      const lastAttempt = new Date(subscription.metadata?.lastFailedPayment?.date);
      const hoursSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastAttempt < 24) {
        this.logger.log(`Skipping subscription ${subscription.id} - too soon since last attempt`);
        continue;
      }

      await this.processSubscriptionRenewal(subscription);

      // Wait a bit between processing to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.logger.log('Completed retrying failed payments');
  }
}
