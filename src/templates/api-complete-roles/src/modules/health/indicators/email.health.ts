import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { EmailService } from '../../../common/email/email.service';

@Injectable()
export class EmailHealthIndicator extends HealthIndicator {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const transporter = this.emailService.getTransporter();

    if (!transporter) {
      const result = this.getStatus(key, false, {
        message: 'Email service not configured - missing credentials',
      });
      throw new HealthCheckError('Email check failed', result);
    }

    try {
      // Verify SMTP connection
      await transporter.verify();

      return this.getStatus(key, true, {
        message: 'Email service is operational',
      });
    } catch (error) {
      const result = this.getStatus(key, false, {
        message: error.message || 'Email service verification failed',
      });
      throw new HealthCheckError('Email check failed', result);
    }
  }
}
