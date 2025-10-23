import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name: string) {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: 'Password Reset Request',
        html: htmlContent,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendPaymentSuccessEmail(email: string, name: string, amount: number, planName: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #10B981; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Your payment has been processed successfully. Thank you for your subscription!</p>
            <div class="details">
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)} USD</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your subscription is now active. You can access all premium features.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: 'Payment Successful - Subscription Activated',
        html: htmlContent,
      });
      this.logger.log(`Payment success email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send payment success email to ${email}`, error);
    }
  }

  async sendBankTransferApprovedEmail(
    email: string,
    name: string,
    amount: number,
    planName: string,
  ) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #10B981; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bank Transfer Approved!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Great news! Your bank transfer payment has been approved and processed.</p>
            <div class="details">
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)} USD</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your subscription is now active. Thank you for your payment!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: 'Bank Transfer Approved - Subscription Activated',
        html: htmlContent,
      });
      this.logger.log(`Bank transfer approved email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send bank transfer approved email to ${email}`, error);
    }
  }

  async sendBankTransferRejectedEmail(email: string, name: string, amount: number, reason: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #EF4444; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Requires Attention</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Unfortunately, we couldn't approve your bank transfer payment of $${amount.toFixed(2)} USD.</p>
            <div class="details">
              <p><strong>Reason:</strong></p>
              <p>${reason}</p>
            </div>
            <p>Please review the issue and submit a new receipt, or contact our support team for assistance.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: 'Bank Transfer Payment - Action Required',
        html: htmlContent,
      });
      this.logger.log(`Bank transfer rejected email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send bank transfer rejected email to ${email}`, error);
    }
  }

  async sendSubscriptionExpiringEmail(
    email: string,
    name: string,
    planName: string,
    daysRemaining: number,
  ) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expiring Soon</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Your <strong>${planName}</strong> subscription will expire in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.</p>
            <p>To continue enjoying all premium features, please renew your subscription.</p>
            <p style="text-align: center;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/subscription" class="button">Renew Now</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: `Subscription Expiring in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
        html: htmlContent,
      });
      this.logger.log(`Subscription expiring email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send subscription expiring email to ${email}`, error);
    }
  }

  async sendAdminBankTransferNotification(
    transactionId: string,
    userName: string,
    userEmail: string,
    amount: number,
    planName: string,
    referenceNumber: string,
  ) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');

    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not configured, skipping admin notification');
      return;
    }

    const reviewUrl = `${this.configService.get<string>('FRONTEND_URL')}/admin/transactions/${transactionId}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .urgent { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Bank Transfer Pending Review</h1>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <div class="urgent">
              <strong>Action Required:</strong> A new bank transfer receipt has been submitted and requires approval.
            </div>
            <div class="details">
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Customer:</strong> ${userName} (${userEmail})</p>
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)} USD</p>
              <p><strong>Reference Number:</strong> ${referenceNumber}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Please review the payment receipt and approve or reject the transaction.</p>
            <p style="text-align: center;">
              <a href="${reviewUrl}" class="button">Review Transaction</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: adminEmail,
        subject: `[Action Required] New Bank Transfer - $${amount.toFixed(2)} from ${userName}`,
        html: htmlContent,
      });
      this.logger.log(`Admin bank transfer notification sent for transaction ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send admin bank transfer notification for ${transactionId}`,
        error,
      );
    }
  }

  async sendRefundConfirmationEmail(
    email: string,
    name: string,
    amount: number,
    currency: string,
    planName: string,
    reason: string,
  ) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Processed</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Your refund request has been processed successfully.</p>
            <div class="details">
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Refund Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>The refund will appear in your account within 5-10 business days, depending on your payment method and bank.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: `Refund Processed - ${currency} ${amount.toFixed(2)}`,
        html: htmlContent,
      });
      this.logger.log(`Refund confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send refund confirmation email to ${email}`, error);
    }
  }

  /**
   * Send team invitation email
   */
  async sendInvitationEmail(
    email: string,
    invitedByName: string,
    accountName: string,
    token: string,
  ) {
    const invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/accept-invitation?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4F46E5; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You've Been Invited!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${invitedByName}</strong> has invited you to join <strong>${accountName}</strong> on ${this.configService.get<string>('APP_NAME')}.</p>
            <div class="details">
              <p><strong>Account:</strong> ${accountName}</p>
              <p><strong>Invited by:</strong> ${invitedByName}</p>
              <p><strong>Invitation sent to:</strong> ${email}</p>
            </div>
            <p>Click the button below to accept the invitation and create your account:</p>
            <p style="text-align: center;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${invitationUrl}</p>
            <p><strong>This invitation will expire in 7 days.</strong></p>
            <p>If you don't want to join this team, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: `You've been invited to join ${accountName}`,
        html: htmlContent,
      });
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    email: string,
    name: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    pdfPath: string,
  ) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${invoiceNumber}</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for your payment. Your invoice is attached to this email.</p>
            <div class="details">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>The invoice PDF is attached to this email for your records.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.configService.get<string>('APP_NAME')}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to: email,
        subject: `Invoice ${invoiceNumber} - ${currency} ${amount.toFixed(2)}`,
        html: htmlContent,
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            path: pdfPath,
          },
        ],
      });
      this.logger.log(`Invoice email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email to ${email}`, error);
      throw error;
    }
  }
}
