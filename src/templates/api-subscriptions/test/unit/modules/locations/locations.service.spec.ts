import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from '../../../../src/modules/locations/locations.service';
import { LocationRepository } from '../../../../src/modules/locations/repositories/location.repository';
import { SubscriptionRepository } from '../../../../src/modules/subscriptions/repositories/subscription.repository';
import { AccountRepository } from '../../../../src/modules/accounts/repositories/account.repository';
import { Location } from '../../../../src/modules/locations/entities/location.entity';
import { AccountType } from '../../../../src/modules/accounts/entities/account.entity';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SubscriptionStatus } from '../../../../src/modules/subscriptions/entities/subscription.entity';

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepository: LocationRepository;
  let subscriptionRepository: SubscriptionRepository;
  let accountRepository: AccountRepository;

  const mockLocation: Location = {
    id: 'location-1',
    accountId: 'account-1',
    name: 'Main Office',
    code: 'MO-001',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001',
    phone: '+1234567890',
    email: 'office@company.com',
    latitude: 40.7128,
    longitude: -74.006,
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined as any,
    account: undefined as any,
  };

  const mockAccount = {
    id: 'account-1',
    accountType: AccountType.TENANT,
    name: 'Test Company',
  };

  const mockSubscription = {
    id: 'sub-1',
    accountId: 'account-1',
    status: SubscriptionStatus.ACTIVE,
    plan: {
      id: 'plan-1',
      maxLocations: 10,
    },
  };

  const mockLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findByAccountId: jest.fn(),
    findOne: jest.fn(),
    countByAccountId: jest.fn(),
    softDeleteLocation: jest.fn(),
  };

  const mockSubscriptionRepository = {
    findActiveByAccountId: jest.fn(),
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: LocationRepository,
          useValue: mockLocationRepository,
        },
        {
          provide: SubscriptionRepository,
          useValue: mockSubscriptionRepository,
        },
        {
          provide: AccountRepository,
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    locationRepository = module.get<LocationRepository>(LocationRepository);
    subscriptionRepository = module.get<SubscriptionRepository>(SubscriptionRepository);
    accountRepository = module.get<AccountRepository>(AccountRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Main Office',
      code: 'MO-001',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
    };

    it('should create a location successfully for tenant account', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockSubscriptionRepository.findActiveByAccountId.mockResolvedValue(mockSubscription);
      mockLocationRepository.countByAccountId.mockResolvedValue(5);
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);

      const result = await service.create(createDto, 'account-1');

      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { id: 'account-1' } });
      expect(subscriptionRepository.findActiveByAccountId).toHaveBeenCalledWith('account-1');
      expect(locationRepository.countByAccountId).toHaveBeenCalledWith('account-1');
      expect(locationRepository.create).toHaveBeenCalledWith({
        ...createDto,
        accountId: 'account-1',
      });
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'account-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if account is not tenant', async () => {
      mockAccountRepository.findOne.mockResolvedValue({
        ...mockAccount,
        accountType: AccountType.INDIVIDUAL,
      });

      await expect(service.create(createDto, 'account-1')).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, 'account-1')).rejects.toThrow(
        'Only tenant accounts can create locations',
      );
    });

    it('should throw BadRequestException if no active subscription', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockSubscriptionRepository.findActiveByAccountId.mockResolvedValue(null);

      await expect(service.create(createDto, 'account-1')).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, 'account-1')).rejects.toThrow(
        'No active subscription found',
      );
    });

    it('should throw ForbiddenException if plan does not allow locations', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockSubscriptionRepository.findActiveByAccountId.mockResolvedValue({
        ...mockSubscription,
        plan: { maxLocations: 0 },
      });

      await expect(service.create(createDto, 'account-1')).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, 'account-1')).rejects.toThrow(
        'Your current plan does not allow locations',
      );
    });

    it('should throw BadRequestException if location limit reached', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockSubscriptionRepository.findActiveByAccountId.mockResolvedValue(mockSubscription);
      mockLocationRepository.countByAccountId.mockResolvedValue(10); // Already at limit

      await expect(service.create(createDto, 'account-1')).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, 'account-1')).rejects.toThrow(
        'You have reached the maximum number of locations (10) allowed by your plan',
      );
    });
  });

  describe('findAll', () => {
    it('should return all locations for account', async () => {
      const locations = [mockLocation, { ...mockLocation, id: 'location-2' }];
      mockLocationRepository.findByAccountId.mockResolvedValue(locations);

      const result = await service.findAll('account-1');

      expect(locationRepository.findByAccountId).toHaveBeenCalledWith('account-1');
      expect(result).toEqual(locations);
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findOne('location-1', 'account-1');

      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'location-1', accountId: 'account-1' },
      });
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('location-1', 'account-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a location successfully', async () => {
      const updateDto = { name: 'Updated Office', city: 'Boston' };
      const updatedLocation = { ...mockLocation, ...updateDto };

      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(updatedLocation);

      const result = await service.update('location-1', updateDto, 'account-1');

      expect(locationRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Office');
      expect(result.city).toBe('Boston');
    });

    it('should throw NotFoundException if location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(service.update('location-1', { name: 'Updated' }, 'account-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a location successfully', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockLocationRepository.softDeleteLocation.mockResolvedValue(undefined);

      await service.remove('location-1', 'account-1');

      expect(locationRepository.softDeleteLocation).toHaveBeenCalledWith('location-1');
    });

    it('should throw NotFoundException if location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('location-1', 'account-1')).rejects.toThrow(NotFoundException);
    });
  });
});
