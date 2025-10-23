import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });

    this.logger.log('Stripe service initialized');
  }

  /**
   * Create a payment intent for a subscription payment
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
    customerId?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      };

      if (customerId) {
        paymentIntentData.customer = customerId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent', error);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent by ID
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error retrieving payment intent ${paymentIntentId}`, error);
      throw new BadRequestException(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};

      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmParams,
      );

      this.logger.log(`Payment intent confirmed: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming payment intent ${paymentIntentId}`, error);
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      this.logger.log(`Payment intent cancelled: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error cancelling payment intent ${paymentIntentId}`, error);
      throw new BadRequestException(`Failed to cancel payment: ${error.message}`);
    }
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error creating Stripe customer', error);
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Retrieve a customer by ID
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      return (await this.stripe.customers.retrieve(customerId)) as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Error retrieving customer ${customerId}`, error);
      throw new BadRequestException(`Failed to retrieve customer: ${error.message}`);
    }
  }

  /**
   * Create a refund for a charge
   */
  async createRefund(chargeId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        charge: chargeId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      if (reason) {
        refundData.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund for charge ${chargeId}`, error);
      throw new BadRequestException(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Refund a payment intent
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = amount; // Amount already in cents
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.logger.log(`Refund created for payment intent ${paymentIntentId}: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Error refunding payment intent ${paymentIntentId}`, error);
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Create a Stripe Checkout Session for one-time payment
   */
  async createCheckoutSession(
    amount: number,
    currency: string,
    description: string,
    metadata: Record<string, any>,
    customerId?: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: description,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        metadata,
        success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/payments/cancel`,
      };

      if (customerId) {
        sessionData.customer = customerId;
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);

      this.logger.log(`Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Error creating checkout session', error);
      throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Get Stripe instance (for advanced operations)
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
