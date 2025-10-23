import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UsersController } from '../../../../src/modules/users/users.controller';
import { UsersService } from '../../../../src/modules/users/users.service';
import { CreateUserDto } from '../../../../src/modules/users/dto/create-user.dto';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let cacheManager: any;

  const mockUser: Partial<User> = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockRequest = (userId: string) =>
    ({
      user: { userId, email: 'test@example.com' },
    }) as any;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAccountId: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    cacheManager = module.get(CACHE_MANAGER);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const req = createMockRequest('requesting-user-id');

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto, req);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto, 'requesting-user-id');
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after creating user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const req = createMockRequest('requesting-user-id');

      mockUsersService.create.mockResolvedValue(mockUser);

      await controller.create(createUserDto, req);

      expect(cacheManager.del).toHaveBeenCalledWith('users_all');
      expect(cacheManager.del).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from service', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const req = createMockRequest('requesting-user-id');

      const error = new Error('User already exists');
      mockUsersService.create.mockRejectedValue(error);

      await expect(controller.create(createUserDto, req)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors when user not found', async () => {
      const error = new Error('User not found');
      mockUsersService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('999')).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all members of the user account', async () => {
      const req = createMockRequest('user-1');
      const currentUser = {
        ...mockUser,
        id: 'user-1',
        accountId: 'account-1',
      };
      const members = [
        currentUser,
        { ...mockUser, id: 'user-2', email: 'member2@company.com' },
        { ...mockUser, id: 'user-3', email: 'member3@company.com' },
      ];

      mockUsersService.findOne.mockResolvedValue(currentUser);
      mockUsersService.findByAccountId.mockResolvedValue(members);

      const result = await controller.findAll(req);

      expect(service.findOne).toHaveBeenCalledWith('user-1');
      expect(service.findByAccountId).toHaveBeenCalledWith('account-1');
      expect(result).toEqual(members);
    });

    it('should throw NotFoundException if user has no account', async () => {
      const req = createMockRequest('user-1');
      const userWithoutAccount = {
        ...mockUser,
        accountId: null,
      };

      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.findAll(req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMember', () => {
    it('should delete a member successfully', async () => {
      const req = createMockRequest('user-1');
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.deleteMember(req, 'user-2');

      expect(service.remove).toHaveBeenCalledWith('user-2', 'user-1');
      expect(result).toEqual({ message: 'Member deleted successfully' });
    });

    it('should throw ConflictException when trying to delete self', async () => {
      const req = createMockRequest('user-1');
      const error = new ConflictException('You cannot delete your own account');
      mockUsersService.remove.mockRejectedValue(error);

      await expect(controller.deleteMember(req, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when trying to delete account owner', async () => {
      const req = createMockRequest('user-1');
      const error = new ConflictException('Cannot delete the account owner');
      mockUsersService.remove.mockRejectedValue(error);

      await expect(controller.deleteMember(req, 'owner-id')).rejects.toThrow(ConflictException);
    });
  });
});
