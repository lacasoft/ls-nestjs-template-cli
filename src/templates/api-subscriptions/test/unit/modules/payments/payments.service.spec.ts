import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../../../../src/modules/payments/services/payments.service';
import { TransactionRepository } from '../../../../src/modules/payments/repositories/transaction.repository';
import { StripeService } from '../../../../src/modules/payments/services/stripe.service';
import { PayPalService } from '../../../../src/modules/payments/services/paypal.service';
import { InvoiceService } from '../../../../src/modules/payments/services/invoice.service';
import { SubscriptionsService } from '../../../../src/modules/subscriptions/subscriptions.service';
import { UsersService } from '../../../../src/modules/users/users.service';
import { PlansService } from '../../../../src/modules/plans/plans.service';
import { PaymentPeriodRepository } from '../../../../src/modules/subscriptions/repositories/payment-period.repository';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../../src/common/services/email.service';
import {
  TransactionStatus,
  PaymentMethod,
  TransactionType,
} from '../../../../src/modules/payments/entities/transaction.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let stripeService: jest.Mocked<StripeService>;
  let paypalService: jest.Mocked<PayPalService>;
  let invoiceService: jest.Mocked<InvoiceService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let usersService: jest.Mocked<UsersService>;
  let plansService: jest.Mocked<PlansService>;

  const mockTransaction = {
    id: 'transaction-1',
    userId: 'user-1',
    subscriptionId: 'sub-1',
    amount: 100,
    currency: 'MXN',
    status: TransactionStatus.PENDING,
    paymentMethod: PaymentMethod.STRIPE,
    transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
    stripePaymentIntentId: 'pi_123',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    accountId: 'account-1',
  };

  const mockPlan = {
    id: 'plan-1',
    name: 'Pro Plan',
    price: 100,
    currency: 'MXN',
  };

  const mockSubscription = {
    id: 'sub-1',
    accountId: 'account-1',
    planId: 'plan-1',
    plan: mockPlan,
    currentPrice: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: TransactionRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findByStripePaymentIntentId: jest.fn(),
          },
        },
        {
          provide: StripeService,
          useValue: {
            createPaymentIntent: jest.fn(),
            createCheckoutSession: jest.fn(),
            confirmPaymentIntent: jest.fn(),
            retrievePaymentIntent: jest.fn(),
            createCustomer: jest.fn(),
            refundPayment: jest.fn(),
          },
        },
        {
          provide: PayPalService,
          useValue: {
            createOrder: jest.fn(),
            captureOrder: jest.fn(),
            refundCapture: jest.fn(),
          },
        },
        {
          provide: InvoiceService,
          useValue: {
            createInvoiceForTransaction: jest.fn(),
            generatePDF: jest.fn(),
            sendInvoiceEmail: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            findOne: jest.fn(),
            updateSubscriptionAfterPayment: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PlansService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PaymentPeriodRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPaymentSuccessEmail: jest.fn(),
            sendBankTransferApprovedEmail: jest.fn(),
            sendRefundConfirmationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    transactionRepository = module.get(TransactionRepository);
    stripeService = module.get(StripeService);
    paypalService = module.get(PayPalService);
    invoiceService = module.get(InvoiceService);
    subscriptionsService = module.get(SubscriptionsService);
    usersService = module.get(UsersService);
    plansService = module.get(PlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStripePaymentIntent', () => {
    it('should create a Stripe payment intent', async () => {
      const createDto = {
        subscriptionId: 'sub-1',
        planId: 'plan-1',
        transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
      };

      const mockUserWithMetadata = {
        ...mockUser,
        metadata: {},
      };

      subscriptionsService.findOne.mockResolvedValue(mockSubscription as any);
      usersService.findOne.mockResolvedValue(mockUserWithMetadata as any);
      plansService.findOne.mockResolvedValue(mockPlan as any);

      // Mock createCustomer
      stripeService.createCustomer.mockResolvedValue({
        id: 'cus_123',
      } as any);

      stripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      transactionRepository.create.mockReturnValue(mockTransaction as any);
      transactionRepository.save.mockResolvedValue(mockTransaction as any);
      usersService.update.mockResolvedValue(mockUser as any);

      const result = await service.createStripePaymentIntent(createDto, 'user-1');

      expect(result).toHaveProperty('checkoutSessionId');
      expect(result).toHaveProperty('paymentUrl');
      expect(result.paymentUrl).toBe('https://checkout.stripe.com/pay/cs_test_123');
      expect(stripeService.createCheckoutSession).toHaveBeenCalled();
      expect(transactionRepository.save).toHaveBeenCalled();
    });
  });

  describe('confirmStripePayment', () => {
    it('should confirm a successful Stripe payment', async () => {
      const confirmDto = {
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_123',
      };

      transactionRepository.findByStripePaymentIntentId.mockResolvedValue(mockTransaction as any);
      stripeService.retrievePaymentIntent.mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
      } as any);
      subscriptionsService.findOne.mockResolvedValue(mockSubscription as any);
      usersService.findOne.mockResolvedValue(mockUser as any);

      const result = await service.confirmStripePayment(confirmDto, 'user-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
    });
  });

  describe('refundTransaction', () => {
    it('should process a refund for Stripe payment', async () => {
      const refundTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SUCCEEDED,
        subscription: mockSubscription,
      };

      const mockRefundTrans = {
        id: 'refund-trans-1',
        amount: 100,
      };

      transactionRepository.findOne.mockResolvedValue(refundTransaction as any);
      transactionRepository.create.mockReturnValue(mockRefundTrans as any);
      transactionRepository.save
        .mockResolvedValueOnce(refundTransaction as any)
        .mockResolvedValueOnce(mockRefundTrans as any);

      stripeService.refundPayment.mockResolvedValue({
        id: 'refund_123',
        status: 'succeeded',
      } as any);
      usersService.findOne.mockResolvedValue(mockUser as any);

      const result = await service.refundTransaction(
        'transaction-1',
        'admin-1',
        100,
        'Customer request',
      );

      expect(result.success).toBe(true);
      expect(stripeService.refundPayment).toHaveBeenCalled();
    });
  });

  describe('getBankInfo', () => {
    it('should return bank transfer information', async () => {
      const result = await service.getBankInfo();

      expect(result).toHaveProperty('instructions');
      expect(result.instructions).toContain('transfer');
    });
  });
});
