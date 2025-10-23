import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsController } from '../../../../src/modules/invitations/invitations.controller';
import { InvitationsService } from '../../../../src/modules/invitations/invitations.service';
import { UsersService } from '../../../../src/modules/users/users.service';
import { UserRepository } from '../../../../src/modules/users/repositories/user.repository';
import {
  InvitationToken,
  InvitationStatus,
} from '../../../../src/modules/invitations/entities/invitation-token.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let invitationsService: InvitationsService;
  let usersService: UsersService;
  let userRepository: UserRepository;

  const mockInvitation: InvitationToken = {
    id: 'invitation-1',
    accountId: 'account-1',
    email: 'newuser@company.com',
    token: 'test-token-123',
    roleId: 'role-1',
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    invitedByUserId: 'user-1',
    acceptedByUserId: undefined as any,
    acceptedAt: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined as any,
    account: undefined as any,
    role: undefined as any,
    invitedBy: undefined as any,
    acceptedBy: undefined as any,
  };

  const mockUser = {
    id: 'user-1',
    email: 'owner@company.com',
    accountId: 'account-1',
    firstName: 'John',
    lastName: 'Doe',
    isAccountOwner: true,
  };

  const mockInvitationsService = {
    createInvitation: jest.fn(),
    findByToken: jest.fn(),
    acceptInvitation: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: mockInvitationsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    controller = module.get<InvitationsController>(InvitationsController);
    invitationsService = module.get<InvitationsService>(InvitationsService);
    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteMember', () => {
    it('should create an invitation successfully', async () => {
      const req = { user: { userId: 'user-1' } };
      const inviteDto = {
        email: 'newuser@company.com',
        roleId: 'role-1',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockInvitationsService.createInvitation.mockResolvedValue(mockInvitation);

      const result = await controller.inviteMember(req, inviteDto);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: 'newuser@company.com',
          account: { id: 'account-1' },
        },
      });
      expect(invitationsService.createInvitation).toHaveBeenCalledWith(
        'account-1',
        'newuser@company.com',
        'role-1',
        'user-1',
      );
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException if user has no account', async () => {
      const req = { user: { userId: 'user-1' } };
      const inviteDto = {
        email: 'newuser@company.com',
        roleId: 'role-1',
      };

      mockUsersService.findOne.mockResolvedValue({ ...mockUser, accountId: null });

      await expect(controller.inviteMember(req, inviteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if email already exists in account', async () => {
      const req = { user: { userId: 'user-1' } };
      const inviteDto = {
        email: 'existing@company.com',
        roleId: 'role-1',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(controller.inviteMember(req, inviteDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create user', async () => {
      const acceptDto = {
        token: 'test-token-123',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const newUser = {
        id: 'new-user-1',
        email: 'newuser@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        accountId: 'account-1',
        password: 'hashed-password',
      };

      mockInvitationsService.findByToken.mockResolvedValue(mockInvitation);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);
      mockInvitationsService.acceptInvitation.mockResolvedValue(mockInvitation);

      const result = await controller.acceptInvitation(acceptDto);

      expect(invitationsService.findByToken).toHaveBeenCalledWith('test-token-123');
      expect(usersService.findByEmail).toHaveBeenCalledWith('newuser@company.com');
      expect(userRepository.save).toHaveBeenCalled();
      expect(invitationsService.acceptInvitation).toHaveBeenCalledWith(
        'test-token-123',
        'new-user-1',
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      const acceptDto = {
        token: 'test-token-123',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const acceptedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      };

      mockInvitationsService.findByToken.mockResolvedValue(acceptedInvitation);

      await expect(controller.acceptInvitation(acceptDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invitation is expired', async () => {
      const acceptDto = {
        token: 'test-token-123',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000), // expired
      };

      mockInvitationsService.findByToken.mockResolvedValue(expiredInvitation);

      await expect(controller.acceptInvitation(acceptDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const acceptDto = {
        token: 'test-token-123',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockInvitationsService.findByToken.mockResolvedValue(mockInvitation);
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(controller.acceptInvitation(acceptDto)).rejects.toThrow(BadRequestException);
    });
  });
});
