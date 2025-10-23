import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayPalService {
  private readonly baseURL: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly logger = new Logger(PayPalService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be configured');
    }

    this.baseURL =
      mode === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    this.logger.log(`PayPal service initialized in ${mode} mode`);
  }

  /**
   * Get OAuth access token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken as string;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch(`${this.baseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Failed to get PayPal access token: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      return this.accessToken as string;
    } catch (error) {
      this.logger.error('Error getting PayPal access token', error);
      throw new BadRequestException('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create a PayPal order for subscription payment
   */
  async createOrder(
    amount: number,
    currency: string,
    description: string,
    metadata: Record<string, any>,
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
            description,
            custom_id: metadata.transactionId || undefined,
          },
        ],
        application_context: {
          return_url: metadata.returnUrl || undefined,
          cancel_url: metadata.cancelUrl || undefined,
          brand_name: 'Subscription Service',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      };

      const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`PayPal order created: ${data.id}`);

      // Extract the approval URL from links
      const approvalLink = data.links?.find((link: any) => link.rel === 'approve');

      return {
        orderId: data.id,
        status: data.status,
        approvalUrl: approvalLink?.href || null,
        links: data.links,
      };
    } catch (error) {
      this.logger.error('Error creating PayPal order', error);
      throw new BadRequestException(`Failed to create PayPal order: ${error.message}`);
    }
  }

  /**
   * Capture a PayPal order (complete the payment)
   */
  async captureOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseURL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`PayPal order captured: ${orderId}`);

      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

      return {
        orderId: data.id,
        captureId: capture?.id,
        status: data.status,
        amount: capture?.amount,
        createTime: capture?.create_time,
        updateTime: capture?.update_time,
      };
    } catch (error) {
      this.logger.error(`Error capturing PayPal order ${orderId}`, error);
      throw new BadRequestException(`Failed to capture PayPal payment: ${error.message}`);
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseURL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal API error: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error getting PayPal order ${orderId}`, error);
      throw new BadRequestException(`Failed to get PayPal order: ${error.message}`);
    }
  }

  /**
   * Refund a captured payment
   */
  async refundCapture(captureId: string, amount?: number, currency?: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const refundData: any = {};

      if (amount && currency) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: currency.toUpperCase(),
        };
      }

      const response = await fetch(`${this.baseURL}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      this.logger.log(`PayPal capture refunded: ${captureId}`);

      return {
        refundId: data.id,
        status: data.status,
        amount: data.amount,
      };
    } catch (error) {
      this.logger.error(`Error refunding PayPal capture ${captureId}`, error);
      throw new BadRequestException(`Failed to refund PayPal payment: ${error.message}`);
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhookSignature(headers: Record<string, string>, body: any): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      // PayPal webhook verification payload
      const verificationPayload = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: this.configService.get<string>('PAYPAL_WEBHOOK_ID'),
        webhook_event: body,
      };

      const response = await fetch(`${this.baseURL}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationPayload),
      });

      if (!response.ok) {
        this.logger.error('PayPal webhook verification failed');
        return false;
      }

      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error('Error verifying PayPal webhook signature', error);
      return false;
    }
  }
}
