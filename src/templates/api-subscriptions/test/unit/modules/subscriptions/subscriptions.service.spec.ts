import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '../../../../src/modules/subscriptions/subscriptions.service';
import { SubscriptionRepository } from '../../../../src/modules/subscriptions/repositories/subscription.repository';
import { PaymentPeriodRepository } from '../../../../src/modules/subscriptions/repositories/payment-period.repository';
import { PlanRepository } from '../../../../src/modules/plans/repositories/plan.repository';
import { UserRepository } from '../../../../src/modules/users/repositories/user.repository';
import { LocationRepository } from '../../../../src/modules/locations/repositories/location.repository';
import {
  Subscription,
  SubscriptionStatus,
} from '../../../../src/modules/subscriptions/entities/subscription.entity';
import {
  PaymentPeriod,
  PaymentPeriodStatus,
} from '../../../../src/modules/subscriptions/entities/payment-period.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repository: SubscriptionRepository;
  let paymentPeriodRepository: PaymentPeriodRepository;

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

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    findByAccountId: jest.fn(),
    findActiveByAccountId: jest.fn(),
  };

  const mockPaymentPeriodRepository = {
    findBySubscriptionId: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPlanRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockLocationRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: SubscriptionRepository,
          useValue: mockSubscriptionRepository,
        },
        {
          provide: PaymentPeriodRepository,
          useValue: mockPaymentPeriodRepository,
        },
        {
          provide: PlanRepository,
          useValue: mockPlanRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: LocationRepository,
          useValue: mockLocationRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    repository = module.get<SubscriptionRepository>(SubscriptionRepository);
    paymentPeriodRepository = module.get<PaymentPeriodRepository>(PaymentPeriodRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a subscription by id', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.findOne('1');

      expect(result).toEqual(mockSubscription);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['plan', 'account'],
      });
    });

    it('should throw NotFoundException when subscription not found', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow('Subscription with ID 999 not found');
    });
  });

  describe('findByAccountId', () => {
    it('should return a subscription by account id', async () => {
      mockSubscriptionRepository.findByAccountId.mockResolvedValue(mockSubscription);

      const result = await service.findByAccountId('account-1');

      expect(result).toEqual(mockSubscription);
      expect(repository.findByAccountId).toHaveBeenCalledWith('account-1');
    });

    it('should throw NotFoundException when no subscription found for account', async () => {
      mockSubscriptionRepository.findByAccountId.mockResolvedValue(null);

      await expect(service.findByAccountId('account-999')).rejects.toThrow(NotFoundException);
      await expect(service.findByAccountId('account-999')).rejects.toThrow(
        'No subscription found for account account-999',
      );
    });
  });

  describe('findActiveByAccountId', () => {
    it('should return active subscription by account id', async () => {
      mockSubscriptionRepository.findActiveByAccountId.mockResolvedValue(mockSubscription);

      const result = await service.findActiveByAccountId('account-1');

      expect(result).toEqual(mockSubscription);
      expect(repository.findActiveByAccountId).toHaveBeenCalledWith('account-1');
    });

    it('should return null when no active subscription found', async () => {
      mockSubscriptionRepository.findActiveByAccountId.mockResolvedValue(null);

      const result = await service.findActiveByAccountId('account-999');

      expect(result).toBeNull();
      expect(repository.findActiveByAccountId).toHaveBeenCalledWith('account-999');
    });
  });

  describe('findPaymentPeriodsBySubscriptionId', () => {
    it('should return payment periods by subscription id', async () => {
      const periods = [mockPaymentPeriod];
      mockPaymentPeriodRepository.findBySubscriptionId.mockResolvedValue(periods);

      const result = await service.findPaymentPeriodsBySubscriptionId('1');

      expect(result).toEqual(periods);
      expect(paymentPeriodRepository.findBySubscriptionId).toHaveBeenCalledWith('1');
    });

    it('should return empty array when no payment periods found', async () => {
      mockPaymentPeriodRepository.findBySubscriptionId.mockResolvedValue([]);

      const result = await service.findPaymentPeriodsBySubscriptionId('999');

      expect(result).toEqual([]);
      expect(paymentPeriodRepository.findBySubscriptionId).toHaveBeenCalledWith('999');
    });
  });
});
