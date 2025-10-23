import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../../src/modules/users/users.service';
import { UserRepository } from '../../../../src/modules/users/repositories/user.repository';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { CreateUserDto } from '../../../../src/modules/users/dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  // Removed unused repository variable

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    findByAccountId: jest.fn(),
    softDeleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // Removed assignment to unused repository variable
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User({ id: '1', ...createUserDto });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(result).toEqual(user);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(new User({ id: '1' }));

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = new User({ id: '1', email: 'test@example.com' });

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a user successfully', async () => {
      const user = new User({
        id: 'user-2',
        email: 'user2@example.com',
        isAccountOwner: false,
      });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.softDeleteUser.mockResolvedValue(undefined);

      await service.remove('user-2', 'user-1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        withDeleted: false,
      });
      expect(mockUserRepository.softDeleteUser).toHaveBeenCalledWith('user-2');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('user-2', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when trying to delete self', async () => {
      const user = new User({
        id: 'user-1',
        email: 'user1@example.com',
        isAccountOwner: false,
      });

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.remove('user-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when trying to delete account owner', async () => {
      const user = new User({
        id: 'owner-id',
        email: 'owner@example.com',
        isAccountOwner: true,
      });

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.remove('owner-id', 'user-1')).rejects.toThrow(ConflictException);
    });
  });
});
