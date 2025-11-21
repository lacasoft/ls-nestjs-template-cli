import { Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';

export const EMAIL_QUEUE = 'email-queue';

/**
 * Email Queue Processor
 *
 * Processes email jobs asynchronously using Bull Queue.
 * Used to send emails from other services (e.g., AuthService)
 *
 * To queue an email:
 * ```typescript
 * await this.emailQueue.add('password-reset', {
 *   email: 'user@example.com',
 *   resetToken: 'token123',
 *   userName: 'John Doe'
 * });
 * ```
 */
@Processor(EMAIL_QUEUE)
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  // Specific processors can be added here when needed
  // Example:
  // @Process('password-reset')
  // async handlePasswordReset(job: Job<PasswordResetData>): Promise<void> {
  //   await this.emailService.sendPasswordResetEmail(...);
  // }
}
