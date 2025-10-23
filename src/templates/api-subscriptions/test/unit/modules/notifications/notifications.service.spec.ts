import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../../../src/modules/notifications/notifications.service';
import { NotificationRepository } from '../../../../src/modules/notifications/repositories/notification.repository';
import { NotificationPreferencesRepository } from '../../../../src/modules/notifications/repositories/notification-preferences.repository';
import { EmailService } from '../../../../src/common/services/email.service';
import {
  NotificationType,
  NotificationChannel,
} from '../../../../src/modules/notifications/entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationRepository>;
  let emailService: jest.Mocked<EmailService>;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.PAYMENT_SUCCESS,
    channels: [NotificationChannel.IN_APP],
    title: 'Payment Successful',
    message: 'Your payment has been processed',
    read: false,
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findByUserId: jest.fn(),
            findOne: jest.fn(),
            countUnread: jest.fn(),
            markAsRead: jest.fn(),
          },
        },
        {
          provide: NotificationPreferencesRepository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPaymentSuccessEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(NotificationRepository);
    emailService = module.get(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      repository.create.mockResolvedValue(mockNotification as any);

      const result = await service.createNotification(
        'user-1',
        NotificationType.PAYMENT_SUCCESS,
        'Payment Successful',
        'Your payment has been processed',
        {},
        undefined,
        [NotificationChannel.IN_APP],
      );

      expect(result).toEqual(mockNotification);
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const query = { page: 1, limit: 10 };
      const notifications = {
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 10,
        unreadCount: 0,
      };
      repository.findByUserId.mockResolvedValue([mockNotification] as any);
      repository.countUnread = jest.fn().mockResolvedValue(0);

      const result = await service.getUserNotifications('user-1', query);

      expect(result).toBeDefined();
      expect(repository.findByUserId).toHaveBeenCalledWith('user-1', 1, 10);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = { ...mockNotification, read: true, readAt: new Date() };
      repository.findOne.mockResolvedValue(mockNotification as any);
      repository.markAsRead.mockResolvedValue(readNotification as any);

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.read).toBe(true);
      expect(repository.findOne).toHaveBeenCalledWith('notif-1');
      expect(repository.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });
});
