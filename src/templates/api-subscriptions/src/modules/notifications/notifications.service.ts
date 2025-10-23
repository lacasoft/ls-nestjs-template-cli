import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationPreferencesRepository } from './repositories/notification-preferences.repository';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from './entities/notification.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly preferencesRepository: NotificationPreferencesRepository,
  ) {}

  async getUserNotifications(userId: string, query: GetNotificationsDto) {
    const { page, limit } = query;
    const result = await this.notificationRepository.findByUserId(userId, page, limit);

    const unreadCount = await this.notificationRepository.countUnread(userId);

    return {
      ...result,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this notification');
    }

    if (notification.read) {
      return notification; // Already read
    }

    const updated = await this.notificationRepository.markAsRead(notificationId);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
    return updated;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferencesRepository.findOrCreate(userId);
  }

  async updatePreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.update(userId, updateDto);
  }

  // Helper method to create notifications
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    actionUrl?: string,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
  ): Promise<Notification> {
    try {
      return await this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        data,
        actionUrl,
        channels,
      });
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${userId}`, error);
      throw error;
    }
  }

  // Helper method to check if user should receive notification based on preferences
  async shouldNotify(
    userId: string,
    notificationType: string,
  ): Promise<{ enabled: boolean; channels: NotificationChannel[] }> {
    const preferences = await this.preferencesRepository.findOrCreate(userId);

    // Map notification types to preference fields
    const preferenceMap: Record<
      string,
      { enabled: keyof NotificationPreferences; channels: keyof NotificationPreferences }
    > = {
      [NotificationType.PAYMENT_SUCCESS]: {
        enabled: 'paymentSuccess',
        channels: 'paymentSuccessChannels',
      },
      [NotificationType.PAYMENT_FAILED]: {
        enabled: 'paymentFailed',
        channels: 'paymentFailedChannels',
      },
      [NotificationType.SUBSCRIPTION_EXPIRING]: {
        enabled: 'subscriptionExpiring',
        channels: 'subscriptionExpiringChannels',
      },
      [NotificationType.SUBSCRIPTION_EXPIRED]: {
        enabled: 'subscriptionExpired',
        channels: 'subscriptionExpiredChannels',
      },
      [NotificationType.TRIAL_EXPIRING]: {
        enabled: 'trialExpiring',
        channels: 'trialExpiringChannels',
      },
      [NotificationType.BANK_TRANSFER_APPROVED]: {
        enabled: 'bankTransferStatus',
        channels: 'bankTransferStatusChannels',
      },
      [NotificationType.BANK_TRANSFER_REJECTED]: {
        enabled: 'bankTransferStatus',
        channels: 'bankTransferStatusChannels',
      },
      [NotificationType.BANK_TRANSFER_PENDING]: {
        enabled: 'bankTransferStatus',
        channels: 'bankTransferStatusChannels',
      },
      [NotificationType.INVITATION_RECEIVED]: {
        enabled: 'invitations',
        channels: 'invitationsChannels',
      },
      [NotificationType.INVITATION_SENT]: {
        enabled: 'invitations',
        channels: 'invitationsChannels',
      },
      [NotificationType.INVITATION_ACCEPTED]: {
        enabled: 'invitations',
        channels: 'invitationsChannels',
      },
      [NotificationType.SYSTEM_ANNOUNCEMENT]: {
        enabled: 'systemAnnouncements',
        channels: 'systemAnnouncementsChannels',
      },
    };

    const mapping = preferenceMap[notificationType];
    if (!mapping) {
      // If no mapping, default to enabled with in-app only
      return { enabled: true, channels: [NotificationChannel.IN_APP] };
    }

    const enabled = preferences[mapping.enabled] as boolean;
    const channels = preferences[mapping.channels] as NotificationChannel[];

    return { enabled, channels };
  }
}
