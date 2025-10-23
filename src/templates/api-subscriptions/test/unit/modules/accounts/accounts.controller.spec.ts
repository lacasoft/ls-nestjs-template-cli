import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsController } from '../../../../src/modules/accounts/accounts.controller';
import { AccountsService } from '../../../../src/modules/accounts/accounts.service';
import { UsersService } from '../../../../src/modules/users/users.service';
import { Account } from '../../../../src/modules/accounts/entities/account.entity';

describe('AccountsController', () => {
  let controller: AccountsController;
  let accountsService: AccountsService;
  let usersService: UsersService;

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

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    accountId: '1',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockAccountsService = {
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    accountsService = module.get<AccountsService>(AccountsService);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyAccount', () => {
    it('should return user account', async () => {
      const mockRequest = {
        user: {
          userId: 'user-1',
          email: 'test@test.com',
        },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockAccountsService.findOne.mockResolvedValue(mockAccount);

      const result = await controller.getMyAccount(mockRequest);

      expect(result).toEqual(mockAccount);
      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(accountsService.findOne).toHaveBeenCalledWith('1');
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

      await expect(controller.getMyAccount(mockRequest)).rejects.toThrow(NotFoundException);
      await expect(controller.getMyAccount(mockRequest)).rejects.toThrow(
        'User has no account assigned',
      );
    });
  });
});
