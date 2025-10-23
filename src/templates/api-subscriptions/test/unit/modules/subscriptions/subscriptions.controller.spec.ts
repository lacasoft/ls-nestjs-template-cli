import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionsController } from '../../../../src/modules/subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../../../../src/modules/subscriptions/subscriptions.service';
import { UsersService } from '../../../../src/modules/users/users.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../../../../src/modules/subscriptions/entities/subscription.entity';
import {
  PaymentPeriod,
  PaymentPeriodStatus,
} from '../../../../src/modules/subscriptions/entities/payment-period.entity';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let subscriptionsService: SubscriptionsService;
  let usersService: UsersService;

  const mockSubscription: Subscription = {
    id: '1',
    account: undefined as any,
    accountId: 'account-1',
    plan: undefined as any,
    planId: 'plan-1',
    status: SubscriptionStatus.ACTIVE,
    trialStartsAt: new Date(),
    trialEndsAt: new Date(),
    startsAt: new Date(),
    endsAt: undefined as any,
    nextBillingDate: new Date(),
    canceledAt: undefined as any,
    cancelReason: undefined as any,
    currentPrice: 9.99,
    autoRenew: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    accountId: 'account-1',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockPaymentPeriod: PaymentPeriod = {
    id: '1',
    subscription: undefined as any,
    subscriptionId: '1',
    periodStartsAt: new Date('2025-01-01'),
    periodEndsAt: new Date('2025-01-31'),
    amount: 9.99,
    status: PaymentPeriodStatus.PAID,
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscriptionsService = {
    findByAccountId: jest.fn(),
    findPaymentPeriodsBySubscriptionId: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMySubscription', () => {
    it('should return user subscription', async () => {
      const mockRequest = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
        },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockSubscriptionsService.findByAccountId.mockResolvedValue(mockSubscription);

      const result = await controller.getMySubscription(mockRequest);

      expect(result).toEqual(mockSubscription);
      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(subscriptionsService.findByAccountId).toHaveBeenCalledWith('account-1');
    });

    it('should throw NotFoundException when user has no account', async () => {
      const mockRequest = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
        },
      };

      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.getMySubscription(mockRequest)).rejects.toThrow(NotFoundException);
      await expect(controller.getMySubscription(mockRequest)).rejects.toThrow(
        'User has no account assigned',
      );
    });
  });

  describe('getMyPaymentPeriods', () => {
    it('should return user payment periods', async () => {
      const mockRequest = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
        },
      };

      const periods = [mockPaymentPeriod];
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockSubscriptionsService.findByAccountId.mockResolvedValue(mockSubscription);
      mockSubscriptionsService.findPaymentPeriodsBySubscriptionId.mockResolvedValue(periods);

      const result = await controller.getMyPaymentPeriods(mockRequest);

      expect(result).toEqual(periods);
      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(subscriptionsService.findByAccountId).toHaveBeenCalledWith('account-1');
      expect(subscriptionsService.findPaymentPeriodsBySubscriptionId).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user has no account', async () => {
      const mockRequest = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
        },
      };

      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.getMyPaymentPeriods(mockRequest)).rejects.toThrow(NotFoundException);
      await expect(controller.getMyPaymentPeriods(mockRequest)).rejects.toThrow(
        'User has no account assigned',
      );
    });

    it('should return empty array when no payment periods found', async () => {
      const mockRequest = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
        },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockSubscriptionsService.findByAccountId.mockResolvedValue(mockSubscription);
      mockSubscriptionsService.findPaymentPeriodsBySubscriptionId.mockResolvedValue([]);

      const result = await controller.getMyPaymentPeriods(mockRequest);

      expect(result).toEqual([]);
      expect(subscriptionsService.findPaymentPeriodsBySubscriptionId).toHaveBeenCalledWith('1');
    });
  });
});
