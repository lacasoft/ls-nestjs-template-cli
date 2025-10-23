import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from '../../../../src/modules/accounts/accounts.service';
import { AccountRepository } from '../../../../src/modules/accounts/repositories/account.repository';
import { Account } from '../../../../src/modules/accounts/entities/account.entity';

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: AccountRepository;

  const mockAccount: Account = {
    id: '1',
    name: 'Test Company',
    slug: 'test-company',
    accountType: 'individual' as any,
    description: 'Test company description',
    logo: undefined as any,
    isActive: true,
    settings: { currency: 'USD', timezone: 'UTC' },
    users: [],
    subscriptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined as any,
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    findWithUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: AccountRepository,
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get<AccountRepository>(AccountRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOne('1');

      expect(result).toEqual(mockAccount);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when account not found', async () => {
      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow('Account with ID 999 not found');
    });
  });

  describe('findBySlug', () => {
    it('should return an account by slug', async () => {
      mockAccountRepository.findBySlug.mockResolvedValue(mockAccount);

      const result = await service.findBySlug('test-company');

      expect(result).toEqual(mockAccount);
      expect(repository.findBySlug).toHaveBeenCalledWith('test-company');
    });

    it('should throw NotFoundException when slug not found', async () => {
      mockAccountRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('invalid-slug')).rejects.toThrow(NotFoundException);
      await expect(service.findBySlug('invalid-slug')).rejects.toThrow(
        'Account with slug invalid-slug not found',
      );
    });
  });

  describe('findWithUsers', () => {
    it('should return an account with users', async () => {
      const accountWithUsers = { ...mockAccount, users: [{ id: '1', email: 'test@test.com' }] };
      mockAccountRepository.findWithUsers.mockResolvedValue(accountWithUsers);

      const result = await service.findWithUsers('1');

      expect(result).toEqual(accountWithUsers);
      expect(repository.findWithUsers).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when account not found', async () => {
      mockAccountRepository.findWithUsers.mockResolvedValue(null);

      await expect(service.findWithUsers('999')).rejects.toThrow(NotFoundException);
      await expect(service.findWithUsers('999')).rejects.toThrow('Account with ID 999 not found');
    });
  });
});
