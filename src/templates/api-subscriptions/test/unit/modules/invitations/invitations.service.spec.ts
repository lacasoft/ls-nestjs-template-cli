import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from '../../../../src/modules/invitations/invitations.service';
import { InvitationTokenRepository } from '../../../../src/modules/invitations/repositories/invitation-token.repository';
import {
  InvitationToken,
  InvitationStatus,
} from '../../../../src/modules/invitations/entities/invitation-token.entity';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let repository: InvitationTokenRepository;

  const mockInvitation: InvitationToken = {
    id: 'invitation-1',
    accountId: 'account-1',
    email: 'newuser@company.com',
    token: 'test-token-123',
    roleId: 'role-1',
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

  const mockRepository = {
    findPendingByEmail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findByToken: jest.fn(),
    findPendingByAccountId: jest.fn(),
    markAsAccepted: jest.fn(),
    markAsExpired: jest.fn(),
    markAsRevoked: jest.fn(),
    findOne: jest.fn(),
    findExpiredInvitations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: InvitationTokenRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    repository = module.get<InvitationTokenRepository>(InvitationTokenRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create an invitation successfully', async () => {
      mockRepository.findPendingByEmail.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInvitation);
      mockRepository.save.mockResolvedValue(mockInvitation);

      const result = await service.createInvitation(
        'account-1',
        'newuser@company.com',
        'role-1',
        'user-1',
      );

      expect(repository.findPendingByEmail).toHaveBeenCalledWith(
        'newuser@company.com',
        'account-1',
      );
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockInvitation);
    });

    it('should throw ConflictException if pending invitation exists', async () => {
      mockRepository.findPendingByEmail.mockResolvedValue(mockInvitation);

      await expect(
        service.createInvitation('account-1', 'newuser@company.com', 'role-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should generate unique token for each invitation', async () => {
      mockRepository.findPendingByEmail.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInvitation);
      mockRepository.save.mockResolvedValue(mockInvitation);

      await service.createInvitation('account-1', 'test1@company.com', 'role-1', 'user-1');
      await service.createInvitation('account-1', 'test2@company.com', 'role-1', 'user-1');

      const call1 = mockRepository.create.mock.calls[0][0];
      const call2 = mockRepository.create.mock.calls[1][0];

      expect(call1.token).toBeDefined();
      expect(call2.token).toBeDefined();
      expect(call1.token).not.toEqual(call2.token);
    });
  });

  describe('findByToken', () => {
    it('should find invitation by token', async () => {
      mockRepository.findByToken.mockResolvedValue(mockInvitation);

      const result = await service.findByToken('test-token-123');

      expect(repository.findByToken).toHaveBeenCalledWith('test-token-123');
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockRepository.findByToken.mockResolvedValue(null);

      await expect(service.findByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPendingByAccountId', () => {
    it('should find pending invitations by account', async () => {
      const invitations = [mockInvitation];
      mockRepository.findPendingByAccountId.mockResolvedValue(invitations);

      const result = await service.findPendingByAccountId('account-1');

      expect(repository.findPendingByAccountId).toHaveBeenCalledWith('account-1');
      expect(result).toEqual(invitations);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept a valid invitation', async () => {
      mockRepository.findByToken.mockResolvedValue(mockInvitation);
      mockRepository.markAsAccepted.mockResolvedValue(undefined);

      const result = await service.acceptInvitation('test-token-123', 'new-user-1');

      expect(repository.findByToken).toHaveBeenCalledWith('test-token-123');
      expect(repository.markAsAccepted).toHaveBeenCalledWith('invitation-1', 'new-user-1');
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      const acceptedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      };
      mockRepository.findByToken.mockResolvedValue(acceptedInvitation);

      await expect(service.acceptInvitation('test-token-123', 'new-user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if invitation is expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000),
      };
      mockRepository.findByToken.mockResolvedValue(expiredInvitation);
      mockRepository.markAsExpired.mockResolvedValue(undefined);

      await expect(service.acceptInvitation('test-token-123', 'new-user-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(repository.markAsExpired).toHaveBeenCalledWith('invitation-1');
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke a pending invitation', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvitation);
      mockRepository.markAsRevoked.mockResolvedValue(undefined);

      await service.revokeInvitation('invitation-1', 'account-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'invitation-1', account: { id: 'account-1' } },
      });
      expect(repository.markAsRevoked).toHaveBeenCalledWith('invitation-1');
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.revokeInvitation('invalid-id', 'account-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      const acceptedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      };
      mockRepository.findOne.mockResolvedValue(acceptedInvitation);

      await expect(service.revokeInvitation('invitation-1', 'account-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('expireOldInvitations', () => {
    it('should mark expired invitations as expired', async () => {
      const expiredInvitations = [
        { ...mockInvitation, id: 'inv-1' },
        { ...mockInvitation, id: 'inv-2' },
      ];
      mockRepository.findExpiredInvitations.mockResolvedValue(expiredInvitations);
      mockRepository.markAsExpired.mockResolvedValue(undefined);

      await service.expireOldInvitations();

      expect(repository.findExpiredInvitations).toHaveBeenCalled();
      expect(repository.markAsExpired).toHaveBeenCalledTimes(2);
      expect(repository.markAsExpired).toHaveBeenCalledWith('inv-1');
      expect(repository.markAsExpired).toHaveBeenCalledWith('inv-2');
    });
  });
});
