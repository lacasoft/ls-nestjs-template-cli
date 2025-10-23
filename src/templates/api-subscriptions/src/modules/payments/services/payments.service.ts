import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';
import { InvoiceService } from './invoice.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UsersService } from '../../users/users.service';
import { PlansService } from '../../plans/plans.service';
import {
  Transaction,
  TransactionStatus,
  PaymentMethod,
  TransactionType,
} from '../entities/transaction.entity';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { CreatePayPalOrderDto } from '../dto/create-paypal-order.dto';
import { CapturePayPalOrderDto } from '../dto/capture-paypal-order.dto';
import { BankTransferUploadDto } from '../dto/bank-transfer-upload.dto';
import { GetTransactionsDto } from '../dto/get-transactions.dto';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';
import { PaymentPeriodRepository } from '../../subscriptions/repositories/payment-period.repository';
import { PaymentPeriodStatus } from '../../subscriptions/entities/payment-period.entity';
import { EmailService } from '../../../common/services/email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly defaultCurrency: string;

  constructor(
    private transactionRepository: TransactionRepository,
    private stripeService: StripeService,
    private paypalService: PayPalService,
    private invoiceService: InvoiceService,
    private subscriptionsService: SubscriptionsService,
    private usersService: UsersService,
    private plansService: PlansService,
    private paymentPeriodRepository: PaymentPeriodRepository,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.defaultCurrency = this.configService.get('DEFAULT_CURRENCY', 'MXN');
  }

  /**
   * Create a Stripe payment intent for subscription payment
   */
  async createStripePaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto, userId: string) {
    const { subscriptionId, planId, transactionType, metadata } = createPaymentIntentDto;

    // Verify user access to subscription
    const subscription = await this.subscriptionsService.findOne(subscriptionId);
    const user = await this.usersService.findOne(userId);

    // Check if user has access to this subscription
    const userBelongsToAccount = await this.verifyUserAccessToAccount(
      userId,
      subscription.accountId,
    );

    if (!userBelongsToAccount) {
      throw new ForbiddenException('You do not have access to this subscription');
    }

    // Determine the amount to charge
    let amount: number;
    let plan: any;
    let description: string;

    if (planId) {
      // Payment for a new plan or upgrade
      plan = await this.plansService.findOne(planId);
      amount = Number(plan.price);
      description = `Payment for ${plan.name} plan`;
    } else {
      // Payment for current subscription
      plan = subscription.plan;
      amount = Number(subscription.currentPrice);
      description = `Payment for ${plan.name} subscription`;
    }

    if (amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    // Check if user has a Stripe customer ID
    let stripeCustomerId = user.metadata?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const stripeCustomer = await this.stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
        {
          userId: user.id,
          accountId: subscription.accountId,
        },
      );
      stripeCustomerId = stripeCustomer.id;

      // Save customer ID to user metadata
      await this.usersService.update(user.id, {
        metadata: {
          ...user.metadata,
          stripeCustomerId,
        },
      });
    }

    // Create Stripe Checkout Session (hosted payment page with link)
    const checkoutSession = await this.stripeService.createCheckoutSession(
      amount,
      this.defaultCurrency,
      description,
      {
        userId,
        subscriptionId,
        planId: planId || plan.id,
        transactionType: transactionType || TransactionType.SUBSCRIPTION_PAYMENT,
        ...metadata,
      },
      stripeCustomerId,
    );

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      subscriptionId,
      accountId: subscription.accountId,
      amount,
      currency: this.defaultCurrency,
      paymentMethod: PaymentMethod.STRIPE,
      status: TransactionStatus.PENDING,
      transactionType: transactionType || TransactionType.SUBSCRIPTION_PAYMENT,
      stripeCheckoutSessionId: checkoutSession.id,
      stripeCustomerId,
      description,
      metadata: {
        planId: planId || plan.id,
        planName: plan.name,
        ...metadata,
      },
    });

    await this.transactionRepository.save(transaction);

    this.logger.log(
      `Stripe checkout session created for user ${userId}, transaction ${transaction.id}`,
    );

    return {
      transactionId: transaction.id,
      checkoutSessionId: checkoutSession.id,
      paymentUrl: checkoutSession.url,
      amount,
      currency: this.defaultCurrency,
      status: 'pending',
    };
  }

  /**
   * Confirm a Stripe payment
   */
  async confirmStripePayment(confirmPaymentDto: ConfirmPaymentDto, userId: string) {
    const { paymentIntentId, paymentMethodId } = confirmPaymentDto;

    // Find transaction by payment intent ID
    const transaction =
      await this.transactionRepository.findByStripePaymentIntentId(paymentIntentId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user access
    if (transaction.userId !== userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await this.stripeService.retrievePaymentIntent(paymentIntentId);

    // Check if already succeeded
    if (paymentIntent.status === 'succeeded') {
      // Process the successful payment if not already processed
      if (transaction.status !== TransactionStatus.SUCCEEDED) {
        await this.processSuccessfulPayment(transaction, paymentIntent);
      }

      return {
        success: true,
        transactionId: transaction.id,
        status: 'succeeded',
        message: 'Payment completed successfully',
      };
    }

    // If requires confirmation, confirm it
    if (paymentIntent.status === 'requires_confirmation' || paymentMethodId) {
      const confirmedPayment = await this.stripeService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId,
      );

      if (confirmedPayment.status === 'succeeded') {
        await this.processSuccessfulPayment(transaction, confirmedPayment);

        return {
          success: true,
          transactionId: transaction.id,
          status: 'succeeded',
          message: 'Payment confirmed and completed successfully',
        };
      }

      return {
        success: false,
        transactionId: transaction.id,
        status: confirmedPayment.status,
        message: 'Payment requires additional action',
        requiresAction: confirmedPayment.status === 'requires_action',
        clientSecret: confirmedPayment.client_secret,
      };
    }

    return {
      success: false,
      transactionId: transaction.id,
      status: paymentIntent.status,
      message: 'Payment not completed',
    };
  }

  /**
   * Process successful payment - Update subscription and payment period
   */
  private async processSuccessfulPayment(transaction: Transaction, paymentIntent: any) {
    this.logger.log(`Processing successful payment for transaction ${transaction.id}`);

    // Update transaction
    transaction.status = TransactionStatus.SUCCEEDED;
    transaction.paidAt = new Date();
    transaction.stripeChargeId = paymentIntent.latest_charge || paymentIntent.charges?.data[0]?.id;
    await this.transactionRepository.save(transaction);

    // Get subscription
    const subscription = await this.subscriptionsService.findOne(transaction.subscriptionId);

    // Calculate new billing dates
    const now = new Date();
    const plan = subscription.plan;
    let newBillingDate: Date;
    let newEndsAt: Date;

    // If subscription is expired or not active, start from now
    if (
      subscription.status === SubscriptionStatus.EXPIRED ||
      subscription.status === SubscriptionStatus.CANCELED ||
      !subscription.nextBillingDate ||
      new Date(subscription.nextBillingDate) < now
    ) {
      newBillingDate = new Date(now);
      newBillingDate.setMonth(newBillingDate.getMonth() + 1);
      newEndsAt = new Date(newBillingDate);
    } else {
      // Add to existing billing date (for renewals/upgrades while active)
      newBillingDate = new Date(subscription.nextBillingDate);
      newBillingDate.setMonth(newBillingDate.getMonth() + 1);
      newEndsAt = new Date(newBillingDate);
    }

    // Update subscription
    await this.subscriptionsService.updateSubscriptionAfterPayment(subscription.id, {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: newBillingDate,
      endsAt: newEndsAt,
      startsAt: subscription.startsAt || now,
    });

    // Create or update payment period
    const paymentPeriod = this.paymentPeriodRepository.create({
      subscriptionId: subscription.id,
      periodStartsAt: now,
      periodEndsAt: newBillingDate,
      amount: transaction.amount,
      status: PaymentPeriodStatus.PAID,
      paidAt: now,
    });

    await this.paymentPeriodRepository.save(paymentPeriod);

    this.logger.log(`Subscription ${subscription.id} updated after successful payment`);

    // Send payment success email
    try {
      const user = await this.usersService.findOne(transaction.userId);
      await this.emailService.sendPaymentSuccessEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        Number(transaction.amount),
        plan.name,
      );
    } catch {
      // this.logger.error('Failed to send payment success email', error);
      // Don't throw error - email failure shouldn't fail the payment
    }

    // Generate invoice and send via email
    try {
      const user = await this.usersService.findOne(transaction.userId);
      const invoice = await this.invoiceService.createInvoiceForTransaction(transaction, user);
      await this.invoiceService.generatePDF(invoice.id);
      await this.invoiceService.sendInvoiceEmail(invoice.id);
      this.logger.log(
        `Invoice ${invoice.invoiceNumber} generated and sent for transaction ${transaction.id}`,
      );
    } catch (error) {
      this.logger.error('Failed to generate or send invoice', error);
      // Don't throw error - invoice generation failure shouldn't fail the payment
    }
  }

  /**
   * Get user transactions with pagination and filters
   */
  async getUserTransactions(userId: string, filters: GetTransactionsDto) {
    const { page = 1, limit = 20, status, paymentMethod, subscriptionId } = filters;

    let query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');

    if (subscriptionId) {
      query = query.andWhere('transaction.subscriptionId = :subscriptionId', {
        subscriptionId,
      });
    }

    if (status) {
      query = query.andWhere('transaction.status = :status', { status });
    }

    if (paymentMethod) {
      query = query.andWhere('transaction.paymentMethod = :paymentMethod', {
        paymentMethod,
      });
    }

    const [transactions, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: any) {
    this.logger.log(`Handling Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object);
        break;

      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    const transaction = await this.transactionRepository.findByStripePaymentIntentId(
      paymentIntent.id,
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found for payment intent ${paymentIntent.id}`);
      return;
    }

    if (transaction.status === TransactionStatus.SUCCEEDED) {
      this.logger.log(`Transaction ${transaction.id} already processed`);
      return;
    }

    await this.processSuccessfulPayment(transaction, paymentIntent);
  }

  private async handlePaymentIntentFailed(paymentIntent: any) {
    const transaction = await this.transactionRepository.findByStripePaymentIntentId(
      paymentIntent.id,
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found for payment intent ${paymentIntent.id}`);
      return;
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    await this.transactionRepository.save(transaction);

    this.logger.log(`Transaction ${transaction.id} marked as failed`);
  }

  private async handlePaymentIntentCanceled(paymentIntent: any) {
    const transaction = await this.transactionRepository.findByStripePaymentIntentId(
      paymentIntent.id,
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found for payment intent ${paymentIntent.id}`);
      return;
    }

    transaction.status = TransactionStatus.CANCELLED;
    await this.transactionRepository.save(transaction);

    this.logger.log(`Transaction ${transaction.id} marked as cancelled`);
  }

  private async handleCheckoutSessionCompleted(session: any) {
    // Find transaction by checkout session ID
    const transaction = await this.transactionRepository.findOne({
      where: { stripeCheckoutSessionId: session.id },
      relations: ['subscription', 'subscription.plan'],
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for checkout session ${session.id}`);
      return;
    }

    if (transaction.status === TransactionStatus.SUCCEEDED) {
      this.logger.log(`Transaction ${transaction.id} already processed`);
      return;
    }

    // Payment was successful
    if (session.payment_status === 'paid') {
      // Get the payment intent from the session
      const paymentIntentId = session.payment_intent;

      // Update transaction
      transaction.status = TransactionStatus.SUCCEEDED;
      transaction.paidAt = new Date();
      transaction.stripePaymentIntentId = paymentIntentId;
      await this.transactionRepository.save(transaction);

      // Process subscription changes (similar to processSuccessfulPayment)
      const subscription = await this.subscriptionsService.findOne(transaction.subscriptionId);

      // Calculate new billing dates
      const now = new Date();
      const plan = subscription.plan;
      let newBillingDate: Date;
      let newEndsAt: Date;

      // If subscription is expired or not active, start from now
      if (
        subscription.status === SubscriptionStatus.EXPIRED ||
        subscription.status === SubscriptionStatus.CANCELED
      ) {
        newBillingDate = new Date(now);
        newEndsAt = new Date(now);
      } else {
        // Continue from current billing date
        newBillingDate = subscription.nextBillingDate
          ? new Date(subscription.nextBillingDate)
          : new Date(now);
        newEndsAt = subscription.endsAt ? new Date(subscription.endsAt) : new Date(now);
      }

      // Add billing period based on plan interval
      switch (plan.interval) {
        case 'monthly':
          newBillingDate.setMonth(newBillingDate.getMonth() + plan.intervalCount);
          newEndsAt.setMonth(newEndsAt.getMonth() + plan.intervalCount);
          break;
        case 'yearly':
          newBillingDate.setFullYear(newBillingDate.getFullYear() + plan.intervalCount);
          newEndsAt.setFullYear(newEndsAt.getFullYear() + plan.intervalCount);
          break;
        case 'quarterly':
          newBillingDate.setMonth(newBillingDate.getMonth() + 3 * plan.intervalCount);
          newEndsAt.setMonth(newEndsAt.getMonth() + 3 * plan.intervalCount);
          break;
      }

      // Update subscription
      await this.subscriptionsService.updateSubscriptionAfterPayment(subscription.id, {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: newBillingDate,
        endsAt: newEndsAt,
      });

      this.logger.log(
        `Checkout session ${session.id} processed successfully for transaction ${transaction.id}`,
      );
    }
  }

  // ==================== PAYPAL PAYMENTS ====================

  /**
   * Create a PayPal order for subscription payment
   */
  async createPayPalOrder(createOrderDto: CreatePayPalOrderDto, userId: string) {
    const { subscriptionId, planId, transactionType, returnUrl, cancelUrl, metadata } =
      createOrderDto;

    // Verify user access to subscription
    const subscription = await this.subscriptionsService.findOne(subscriptionId);
    // const user = await this.usersService.findOne(userId);

    const userBelongsToAccount = await this.verifyUserAccessToAccount(
      userId,
      subscription.accountId,
    );

    if (!userBelongsToAccount) {
      throw new ForbiddenException('You do not have access to this subscription');
    }

    // Determine the amount to charge
    let amount: number;
    let plan: any;
    let description: string;

    if (planId) {
      plan = await this.plansService.findOne(planId);
      amount = Number(plan.price);
      description = `Payment for ${plan.name} plan`;
    } else {
      plan = subscription.plan;
      amount = Number(subscription.currentPrice);
      description = `Payment for ${plan.name} subscription`;
    }

    if (amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    // Create transaction record first
    const transaction = this.transactionRepository.create({
      userId,
      subscriptionId,
      accountId: subscription.accountId,
      amount,
      currency: this.defaultCurrency,
      paymentMethod: PaymentMethod.PAYPAL,
      status: TransactionStatus.PENDING,
      transactionType: transactionType || TransactionType.SUBSCRIPTION_PAYMENT,
      description,
      metadata: {
        planId: planId || plan.id,
        planName: plan.name,
        ...metadata,
      },
    });

    await this.transactionRepository.save(transaction);

    // Create PayPal order
    const paypalOrder = await this.paypalService.createOrder(
      amount,
      this.defaultCurrency,
      description,
      {
        transactionId: transaction.id,
        returnUrl,
        cancelUrl,
        ...metadata,
      },
    );

    // Update transaction with PayPal order ID
    transaction.paypalOrderId = paypalOrder.orderId;
    await this.transactionRepository.save(transaction);

    this.logger.log(`PayPal order created for user ${userId}, transaction ${transaction.id}`);

    // Find approval link for frontend
    const approvalLink = paypalOrder.links?.find((link: any) => link.rel === 'approve');

    return {
      transactionId: transaction.id,
      orderId: paypalOrder.orderId,
      status: paypalOrder.status,
      approvalUrl: approvalLink?.href,
      amount,
      currency: this.defaultCurrency,
    };
  }

  /**
   * Capture a PayPal order (complete the payment)
   */
  async capturePayPalOrder(captureOrderDto: CapturePayPalOrderDto, userId: string) {
    const { orderId } = captureOrderDto;

    // Find transaction by PayPal order ID
    const transaction = await this.transactionRepository.findOne({
      where: { paypalOrderId: orderId },
      relations: ['subscription', 'user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user access
    if (transaction.userId !== userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    // Check if already captured
    if (transaction.status === TransactionStatus.SUCCEEDED) {
      return {
        success: true,
        transactionId: transaction.id,
        status: 'completed',
        message: 'Payment already completed',
      };
    }

    // Capture the order
    const captureResult = await this.paypalService.captureOrder(orderId);

    // Update transaction
    transaction.status = TransactionStatus.SUCCEEDED;
    transaction.paypalCaptureId = captureResult.captureId;
    transaction.paidAt = new Date();
    await this.transactionRepository.save(transaction);

    // Process successful payment
    await this.processSuccessfulPayment(transaction, {
      id: captureResult.captureId,
      status: 'succeeded',
    });

    return {
      success: true,
      transactionId: transaction.id,
      captureId: captureResult.captureId,
      status: 'completed',
      message: 'Payment captured successfully',
    };
  }

  /**
   * Get bank transfer information
   */
  async getBankInfo() {
    return {
      bankName: this.configService.get<string>('BANK_NAME'),
      accountNumber: this.configService.get<string>('BANK_ACCOUNT_NUMBER'),
      accountHolder: this.configService.get<string>('BANK_ACCOUNT_HOLDER'),
      accountType: this.configService.get<string>('BANK_ACCOUNT_TYPE'),
      routingNumber: this.configService.get<string>('BANK_ROUTING_NUMBER'),
      swiftCode: this.configService.get<string>('BANK_SWIFT_CODE'),
      whatsappNumber: this.configService.get<string>('WHATSAPP_NUMBER'),
      whatsappMessage: this.configService.get<string>('WHATSAPP_MESSAGE'),
      instructions: 'Please make the transfer to the account above and upload your receipt proof.',
    };
  }

  /**
   * Upload bank transfer receipt and create pending transaction
   */
  async uploadBankTransferReceipt(
    bankTransferUploadDto: BankTransferUploadDto,
    userId: string,
    file: Express.Multer.File,
  ) {
    const { subscriptionId, planId, referenceNumber, notes, metadata } = bankTransferUploadDto;

    // Verify user has access to subscription
    const subscription = await this.subscriptionsService.findOne(subscriptionId);
    const hasAccess = await this.verifyUserAccessToAccount(userId, subscription.accountId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this subscription');
    }

    // Get plan details
    const targetPlanId = planId || subscription.planId;
    const plan = await this.plansService.findOne(targetPlanId);
    const amount = Number(plan.price);

    // Create file path
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `/uploads/receipts/${fileName}`;

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      subscriptionId,
      accountId: subscription.accountId,
      amount,
      currency: this.defaultCurrency,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
      bankTransferReference: referenceNumber,
      bankTransferProofUrl: filePath,
      receiptFileName: fileName,
      receiptMimeType: file.mimetype,
      description: `Bank transfer payment for ${plan.name}`,
      metadata: {
        ...metadata,
        notes,
        originalFileName: file.originalname,
        fileSize: file.size,
      },
    });

    await this.transactionRepository.save(transaction);

    this.logger.log(`Bank transfer receipt uploaded: ${transaction.id} for user: ${userId}`);

    // Get user information for admin notification
    const user = await this.usersService.findOne(userId);
    const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;

    // Send admin notification email
    await this.emailService.sendAdminBankTransferNotification(
      transaction.id,
      userName,
      user.email,
      amount,
      plan.name,
      referenceNumber || 'N/A',
    );

    return {
      transactionId: transaction.id,
      status: TransactionStatus.PENDING,
      message: 'Receipt uploaded successfully. Your payment is pending admin approval.',
      amount,
      currency: this.defaultCurrency,
      receiptUrl: filePath,
    };
  }

  /**
   * Get transaction receipt file details
   */
  async getTransactionReceipt(transactionId: string, userId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['subscription'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user has access
    const hasAccess = await this.verifyUserAccessToAccount(
      userId,
      transaction.subscription.accountId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    if (!transaction.receiptFileName) {
      throw new NotFoundException('No receipt file found for this transaction');
    }

    return {
      transactionId: transaction.id,
      fileName: transaction.receiptFileName,
      mimeType: transaction.receiptMimeType,
      filePath: transaction.bankTransferProofUrl,
      uploadedAt: transaction.createdAt,
      status: transaction.status,
    };
  }

  /**
   * Approve bank transfer (Admin only)
   */
  async approveBankTransfer(transactionId: string, adminUserId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['subscription', 'subscription.plan'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Transaction is not a bank transfer');
    }

    if (transaction.status === TransactionStatus.SUCCEEDED) {
      throw new BadRequestException('Transaction already approved');
    }

    // Update transaction
    transaction.status = TransactionStatus.SUCCEEDED;
    transaction.paidAt = new Date();
    transaction.approvedBy = adminUserId;
    transaction.approvedAt = new Date();

    await this.transactionRepository.save(transaction);

    // Process successful payment (activate subscription, create payment period)
    await this.processSuccessfulPayment(transaction, {
      id: transactionId,
      status: 'succeeded',
    });

    // Send bank transfer approved email
    try {
      const user = await this.usersService.findOne(transaction.userId);
      await this.emailService.sendBankTransferApprovedEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        Number(transaction.amount),
        transaction.subscription.plan.name,
      );
    } catch (error) {
      this.logger.error('Failed to send bank transfer approved email', error);
    }

    this.logger.log(`Bank transfer approved: ${transactionId} by admin: ${adminUserId}`);

    return {
      success: true,
      transactionId: transaction.id,
      status: TransactionStatus.SUCCEEDED,
      message: 'Bank transfer approved successfully',
    };
  }

  /**
   * Reject bank transfer (Admin only)
   */
  async rejectBankTransfer(transactionId: string, adminUserId: string, reason: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Transaction is not a bank transfer');
    }

    if (transaction.status === TransactionStatus.SUCCEEDED) {
      throw new BadRequestException('Cannot reject an approved transaction');
    }

    // Update transaction
    transaction.status = TransactionStatus.FAILED;
    transaction.rejectionReason = reason;
    transaction.approvedBy = adminUserId;
    transaction.approvedAt = new Date();

    await this.transactionRepository.save(transaction);

    // Send bank transfer rejected email
    try {
      const user = await this.usersService.findOne(transaction.userId);
      await this.emailService.sendBankTransferRejectedEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        Number(transaction.amount),
        reason,
      );
    } catch (error) {
      this.logger.error('Failed to send bank transfer rejected email', error);
    }

    this.logger.log(`Bank transfer rejected: ${transactionId} by admin: ${adminUserId}`);

    return {
      success: true,
      transactionId: transaction.id,
      status: TransactionStatus.FAILED,
      message: 'Bank transfer rejected',
      reason,
    };
  }

  /**
   * Handle PayPal webhook events
   */
  async handlePayPalWebhook(headers: Record<string, string>, body: any) {
    this.logger.log(`Handling PayPal webhook event: ${body.event_type}`);

    // Verify webhook signature
    const isValid = await this.paypalService.verifyWebhookSignature(headers, body);
    if (!isValid) {
      this.logger.error('Invalid PayPal webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = body.event_type;
    const resource = body.resource;

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        await this.handlePayPalOrderApproved(resource);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePayPalPaymentCaptureCompleted(resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await this.handlePayPalPaymentCaptureFailed(resource);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await this.handlePayPalPaymentCaptureRefunded(resource);
        break;

      default:
        this.logger.log(`Unhandled PayPal event type: ${eventType}`);
    }

    return { received: true };
  }

  private async handlePayPalOrderApproved(order: any) {
    this.logger.log(`PayPal order approved: ${order.id}`);

    // Find transaction by PayPal order ID
    const transaction = await this.transactionRepository.findByPayPalOrderId(order.id);

    if (!transaction) {
      this.logger.warn(`Transaction not found for PayPal order ${order.id}`);
      return;
    }

    if (transaction.status === TransactionStatus.SUCCEEDED) {
      this.logger.log(`Transaction ${transaction.id} already processed`);
      return;
    }

    // Capture the payment automatically when order is approved
    try {
      const captureResult = await this.paypalService.captureOrder(order.id);

      // Update transaction with capture info
      transaction.status = TransactionStatus.SUCCEEDED;
      transaction.paidAt = new Date();
      transaction.paypalCaptureId = captureResult.captureId;
      await this.transactionRepository.save(transaction);

      // Process subscription changes
      const subscription = await this.subscriptionsService.findOne(transaction.subscriptionId);

      const now = new Date();
      const plan = subscription.plan;
      let newBillingDate: Date;
      let newEndsAt: Date;

      if (
        subscription.status === SubscriptionStatus.EXPIRED ||
        subscription.status === SubscriptionStatus.CANCELED
      ) {
        newBillingDate = new Date(now);
        newEndsAt = new Date(now);
      } else {
        newBillingDate = subscription.nextBillingDate
          ? new Date(subscription.nextBillingDate)
          : new Date(now);
        newEndsAt = subscription.endsAt ? new Date(subscription.endsAt) : new Date(now);
      }

      // Add billing period based on plan interval
      switch (plan.interval) {
        case 'monthly':
          newBillingDate.setMonth(newBillingDate.getMonth() + plan.intervalCount);
          newEndsAt.setMonth(newEndsAt.getMonth() + plan.intervalCount);
          break;
        case 'yearly':
          newBillingDate.setFullYear(newBillingDate.getFullYear() + plan.intervalCount);
          newEndsAt.setFullYear(newEndsAt.getFullYear() + plan.intervalCount);
          break;
        case 'quarterly':
          newBillingDate.setMonth(newBillingDate.getMonth() + 3 * plan.intervalCount);
          newEndsAt.setMonth(newEndsAt.getMonth() + 3 * plan.intervalCount);
          break;
      }

      await this.subscriptionsService.updateSubscriptionAfterPayment(subscription.id, {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: newBillingDate,
        endsAt: newEndsAt,
      });

      this.logger.log(
        `PayPal order ${order.id} captured and processed successfully for transaction ${transaction.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to capture PayPal order ${order.id}`, error);
      transaction.status = TransactionStatus.FAILED;
      transaction.errorMessage = error.message;
      await this.transactionRepository.save(transaction);
    }
  }

  private async handlePayPalPaymentCaptureCompleted(capture: any) {
    // Find transaction by PayPal capture ID or order ID
    const transaction = await this.transactionRepository.findByPayPalOrderId(
      capture.supplementary_data?.related_ids?.order_id || capture.id,
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found for PayPal capture ${capture.id}`);
      return;
    }

    if (transaction.status === TransactionStatus.SUCCEEDED) {
      this.logger.log(`Transaction ${transaction.id} already processed`);
      return;
    }

    await this.processSuccessfulPayment(transaction, capture);
  }

  private async handlePayPalPaymentCaptureFailed(capture: any) {
    const transaction = await this.transactionRepository.findByPayPalOrderId(
      capture.supplementary_data?.related_ids?.order_id || capture.id,
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found for PayPal capture ${capture.id}`);
      return;
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.errorMessage = capture.status_details?.reason || 'Payment failed';
    await this.transactionRepository.save(transaction);

    this.logger.log(`Transaction ${transaction.id} marked as failed`);
  }

  private async handlePayPalPaymentCaptureRefunded(capture: any) {
    const transaction = await this.transactionRepository.findByPayPalOrderId(
      capture.supplementary_data?.related_ids?.order_id || capture.id,
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found for PayPal refund ${capture.id}`);
      return;
    }

    transaction.status = TransactionStatus.REFUNDED;
    await this.transactionRepository.save(transaction);

    this.logger.log(`Transaction ${transaction.id} marked as refunded`);
  }

  /**
   * Verify if user has access to account
   */
  private async verifyUserAccessToAccount(userId: string, accountId: string): Promise<boolean> {
    const user = await this.usersService.findOne(userId);
    return user.accountId === accountId;
  }

  /**
   * Process refund for a transaction (Admin only)
   */
  async refundTransaction(
    transactionId: string,
    adminUserId: string,
    amount?: number,
    reason?: string,
    notes?: string,
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['subscription', 'subscription.plan'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.SUCCEEDED) {
      throw new BadRequestException('Can only refund completed transactions');
    }

    const refundAmount = amount || Number(transaction.amount);

    if (refundAmount > Number(transaction.amount)) {
      throw new BadRequestException('Refund amount cannot exceed original transaction amount');
    }

    let refundResult: any;

    // Process refund based on payment method
    switch (transaction.paymentMethod) {
      case PaymentMethod.STRIPE:
        refundResult = await this.stripeService.refundPayment(
          transaction.stripePaymentIntentId!,
          Math.round(refundAmount * 100), // Convert to cents
        );
        break;

      case PaymentMethod.PAYPAL:
        refundResult = await this.paypalService.refundCapture(
          transaction.paypalCaptureId!,
          refundAmount,
          transaction.currency,
        );
        break;

      case PaymentMethod.BANK_TRANSFER:
        // For bank transfers, just mark as refunded (manual process)
        refundResult = {
          id: `manual_refund_${Date.now()}`,
          status: 'pending',
          amount: refundAmount,
        };
        break;

      default:
        throw new BadRequestException(
          `Refunds not supported for payment method: ${transaction.paymentMethod}`,
        );
    }

    // Create refund transaction record
    const refundTransaction = this.transactionRepository.create({
      userId: transaction.userId,
      subscriptionId: transaction.subscriptionId,
      accountId: transaction.accountId,
      amount: refundAmount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      status:
        transaction.paymentMethod === PaymentMethod.BANK_TRANSFER
          ? TransactionStatus.PENDING
          : TransactionStatus.SUCCEEDED,
      transactionType: TransactionType.REFUND,
      description: `Refund for transaction ${transaction.id}`,
      stripePaymentIntentId: refundResult.payment_intent || undefined,
      paypalOrderId: transaction.paypalOrderId || undefined,
      metadata: {
        originalTransactionId: transaction.id,
        refundReason: reason,
        refundNotes: notes,
        processedBy: adminUserId,
        processedAt: new Date(),
        refundId: refundResult.id,
        refundDetails: refundResult,
      },
    });

    await this.transactionRepository.save(refundTransaction);

    // Update original transaction
    transaction.metadata = {
      ...transaction.metadata,
      refunded: true,
      refundTransactionId: refundTransaction.id,
      refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      refundedBy: adminUserId,
    };
    await this.transactionRepository.save(transaction);

    this.logger.log(
      `Refund processed for transaction ${transaction.id}: ${refundAmount} ${transaction.currency}`,
    );

    // Get user info for email notification
    const user = await this.usersService.findOne(transaction.userId);
    const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;

    // Send refund confirmation email
    await this.emailService.sendRefundConfirmationEmail(
      user.email,
      userName,
      refundAmount,
      transaction.currency,
      transaction.subscription.plan.name,
      reason || 'Refund processed',
    );

    return {
      success: true,
      message:
        transaction.paymentMethod === PaymentMethod.BANK_TRANSFER
          ? 'Refund marked for manual processing. Please process the bank transfer manually.'
          : 'Refund processed successfully',
      refundTransaction,
      originalTransaction: transaction,
      refundAmount,
      currency: transaction.currency,
    };
  }

  /**
   * Generate all payment links for a subscription upgrade
   */
  async generatePaymentLinksForUpgrade(
    subscriptionId: string,
    planId: string,
    userId: string,
    amount: number,
    description: string,
  ) {
    const user = await this.usersService.findOne(userId);
    const subscription = await this.subscriptionsService.findOne(subscriptionId);

    // 1. Create Stripe Payment Intent
    let stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await this.stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
        {
          userId: user.id,
          accountId: subscription.accountId,
        },
      );
      stripeCustomerId = stripeCustomer.id;
      await this.usersService.update(user.id, {
        metadata: {
          ...user.metadata,
          stripeCustomerId,
        },
      });
    }

    // Create Stripe Checkout Session for hosted payment page
    const checkoutSession = await this.stripeService.createCheckoutSession(
      amount,
      this.defaultCurrency,
      description,
      {
        userId,
        subscriptionId,
        planId,
        transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
        reason: 'upgrade',
      },
      stripeCustomerId,
    );

    // Create Stripe transaction
    const stripeTransaction = this.transactionRepository.create({
      userId,
      accountId: subscription.accountId,
      subscriptionId,
      amount,
      currency: this.defaultCurrency,
      paymentMethod: PaymentMethod.STRIPE,
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
      stripeCheckoutSessionId: checkoutSession.id,
      stripeCustomerId,
      description,
      metadata: {
        planId,
        reason: 'upgrade',
      },
    });
    await this.transactionRepository.save(stripeTransaction);

    // 2. Create PayPal Order (optional - skip if credentials not configured)
    let paypalData: { transactionId: string; orderId: any; approvalUrl: any } | null = null;
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      const paypalOrder = await this.paypalService.createOrder(
        amount,
        this.defaultCurrency,
        description,
        {
          userId,
          subscriptionId,
          planId,
          returnUrl: `${frontendUrl}/payments/success`,
          cancelUrl: `${frontendUrl}/payments/cancel`,
        },
      );

      // Create PayPal transaction
      const paypalTransaction = this.transactionRepository.create({
        userId,
        accountId: subscription.accountId,
        subscriptionId,
        amount,
        currency: this.defaultCurrency,
        paymentMethod: PaymentMethod.PAYPAL,
        status: TransactionStatus.PENDING,
        transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
        paypalOrderId: paypalOrder.orderId,
        description,
        metadata: {
          planId,
          reason: 'upgrade',
        },
      });
      await this.transactionRepository.save(paypalTransaction);

      paypalData = {
        transactionId: paypalTransaction.id,
        orderId: paypalOrder.orderId,
        approvalUrl: paypalOrder.approvalUrl,
      };
    } catch (error) {
      this.logger.warn(
        'PayPal payment link generation failed, skipping PayPal option',
        error.message,
      );
    }

    // 3. Generate Bank Transfer info
    const bankTransferTransaction = this.transactionRepository.create({
      userId,
      accountId: subscription.accountId,
      subscriptionId,
      amount,
      currency: this.defaultCurrency,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
      description,
      metadata: {
        planId,
        reason: 'upgrade',
        bankTransferInfo: {
          accountName: this.configService.get<string>('BANK_ACCOUNT_NAME') || 'Company Name',
          accountNumber: this.configService.get<string>('BANK_ACCOUNT_NUMBER') || '1234567890',
          bankName: this.configService.get<string>('BANK_NAME') || 'Bank Name',
          routingNumber: this.configService.get<string>('BANK_ROUTING_NUMBER') || '123456',
          reference: `SUB-${subscriptionId.substring(0, 8).toUpperCase()}`,
        },
      },
    });
    await this.transactionRepository.save(bankTransferTransaction);

    const result: any = {
      stripe: {
        transactionId: stripeTransaction.id,
        checkoutSessionId: checkoutSession.id,
        paymentUrl: checkoutSession.url,
      },
      bankTransfer: {
        transactionId: bankTransferTransaction.id,
        accountName: bankTransferTransaction.metadata.bankTransferInfo.accountName,
        accountNumber: bankTransferTransaction.metadata.bankTransferInfo.accountNumber,
        bankName: bankTransferTransaction.metadata.bankTransferInfo.bankName,
        routingNumber: bankTransferTransaction.metadata.bankTransferInfo.routingNumber,
        reference: bankTransferTransaction.metadata.bankTransferInfo.reference,
        amount,
        currency: this.defaultCurrency,
        instructions: `Please transfer ${amount} ${this.defaultCurrency} to the account above and include the reference: ${bankTransferTransaction.metadata.bankTransferInfo.reference}`,
      },
      amount,
      currency: this.defaultCurrency,
      description,
    };

    // Add PayPal only if it was successfully created
    if (paypalData) {
      result.paypal = paypalData;
    }

    return result;
  }
}
