import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const smtpConfig = this.configService.get('email.smtp');

    if (!smtpConfig?.auth?.user || !smtpConfig?.auth?.pass) {
      this.logger.warn('Email credentials not configured. Email sending will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(smtpConfig);

      // Verify connection (non-blocking)
      this.transporter.verify((error) => {
        if (error) {
          this.logger.warn('Email transporter verification failed. Emails may not be sent.');
          this.logger.warn(
            `SMTP Error: ${error.message}. Check your EMAIL_SMTP_* configuration in .env`,
          );
        } else {
          this.logger.log('Email transporter is ready');
        }
      });
    } catch (error) {
      this.logger.error('Failed to create email transporter:', error);
      this.transporter = null;
    }
  }

  private loadTemplates() {
    try {
      // Use process.cwd() to get project root directory
      // This works in both development (ts-node) and production (compiled JS)
      const templatesDir = path.join(process.cwd(), 'templates', 'emails');
      this.logger.log(`Looking for email templates in: ${templatesDir}`);

      // Load password reset template
      const passwordResetPath = path.join(templatesDir, 'password-reset.hbs');
      if (fs.existsSync(passwordResetPath)) {
        const resetTemplate = fs.readFileSync(passwordResetPath, 'utf-8');
        this.templates.set('password-reset', handlebars.compile(resetTemplate));
        this.logger.log('✅ Password reset template loaded');
      } else {
        this.logger.warn(`❌ Password reset template not found at: ${passwordResetPath}`);
      }

      // Load password changed template
      const passwordChangedPath = path.join(templatesDir, 'password-changed.hbs');
      if (fs.existsSync(passwordChangedPath)) {
        const changedTemplate = fs.readFileSync(passwordChangedPath, 'utf-8');
        this.templates.set('password-changed', handlebars.compile(changedTemplate));
        this.logger.log('✅ Password changed template loaded');
      } else {
        this.logger.warn(`❌ Password changed template not found at: ${passwordChangedPath}`);
      }

      this.logger.log(`Loaded ${this.templates.size} email template(s)`);
    } catch (error) {
      this.logger.error('Error loading email templates:', error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized. Skipping email send.');
      return;
    }

    try {
      const template = this.templates.get('password-reset');
      if (!template) {
        this.logger.error('Password reset template not found');
        return;
      }

      const frontendUrl = this.configService.get<string>('email.frontend.url');
      // Use path parameter instead of query string to prevent token leakage in logs
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      const appConfig = this.configService.get('email.app');

      const html = template({
        userName,
        resetUrl,
        year: new Date().getFullYear(),
        appName: appConfig.name,
        supportEmail: appConfig.supportEmail,
      });

      const fromConfig = this.configService.get('email.from');

      await this.transporter.sendMail({
        from: `"${fromConfig.name}" <${fromConfig.address}>`,
        to: email,
        subject: `Password Recovery - ${appConfig.name}`,
        html,
      });

      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedConfirmation(email: string, userName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized. Skipping email send.');
      return;
    }

    try {
      const template = this.templates.get('password-changed');
      if (!template) {
        this.logger.error('Password changed template not found');
        return;
      }

      const appConfig = this.configService.get('email.app');

      const html = template({
        userName,
        year: new Date().getFullYear(),
        appName: appConfig.name,
        supportEmail: appConfig.supportEmail,
      });

      const fromConfig = this.configService.get('email.from');

      await this.transporter.sendMail({
        from: `"${fromConfig.name}" <${fromConfig.address}>`,
        to: email,
        subject: `Password Updated - ${appConfig.name}`,
        html,
      });

      this.logger.log(`Password changed confirmation email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed confirmation to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get the nodemailer transporter instance for health checks
   */
  getTransporter(): Transporter | null {
    return this.transporter;
  }
}
