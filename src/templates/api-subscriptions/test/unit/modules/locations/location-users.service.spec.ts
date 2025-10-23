import { Test, TestingModule } from '@nestjs/testing';
import { LocationUsersService } from '../../../../src/modules/locations/location-users.service';
import { UserLocationRepository } from '../../../../src/modules/locations/repositories/user-location.repository';
import { LocationRepository } from '../../../../src/modules/locations/repositories/location.repository';
import { UserRepository } from '../../../../src/modules/users/repositories/user.repository';
import { InvitationsService } from '../../../../src/modules/invitations/invitations.service';
import { RolesService } from '../../../../src/modules/roles/roles.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { LocationRoleType } from '../../../../src/modules/locations/entities/user-location.entity';

describe('LocationUsersService', () => {
  let service: LocationUsersService;
  let userLocationRepository: UserLocationRepository;
  let locationRepository: LocationRepository;
  let userRepository: UserRepository;
  let invitationsService: InvitationsService;
  let rolesService: RolesService;

  const mockLocation = {
    id: 'location-1',
    accountId: 'account-1',
    name: 'Main Office',
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    accountId: 'account-1',
    isAccountOwner: false,
    roles: [],
  };

  const mockUserLocation = {
    id: 'user-location-1',
    userId: 'user-1',
    locationId: 'location-1',
    role: LocationRoleType.OBSERVER,
    isActive: true,
    user: mockUser,
    location: mockLocation,
  };

  const mockUserLocationRepository = {
    findByLocationId: jest.fn(),
    findByUserAndLocation: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    removeUserFromLocation: jest.fn(),
  };

  const mockLocationRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockInvitationsService = {
    createInvitation: jest.fn(),
  };

  const mockRolesService = {
    findAllRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationUsersService,
        {
          provide: UserLocationRepository,
          useValue: mockUserLocationRepository,
        },
        {
          provide: LocationRepository,
          useValue: mockLocationRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: InvitationsService,
          useValue: mockInvitationsService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    service = module.get<LocationUsersService>(LocationUsersService);
    userLocationRepository = module.get<UserLocationRepository>(UserLocationRepository);
    locationRepository = module.get<LocationRepository>(LocationRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    invitationsService = module.get<InvitationsService>(InvitationsService);
    rolesService = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsersByLocation', () => {
    it('should return users for a location', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isAccountOwner: true });
      mockUserLocationRepository.findByLocationId.mockResolvedValue([mockUserLocation]);

      const result = await service.getUsersByLocation('location-1', 'user-1');

      expect(result).toEqual([mockUserLocation]);
      expect(mockLocationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'location-1' },
      });
    });

    it('should throw NotFoundException if location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(service.getUsersByLocation('location-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('inviteUserToLocation', () => {
    it('should assign existing user to location', async () => {
      const inviteDto = { email: 'user@example.com', role: LocationRoleType.OBSERVER };
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne
        .mockResolvedValueOnce({ ...mockUser, isAccountOwner: true })
        .mockResolvedValueOnce(mockUser);
      mockUserLocationRepository.findByUserAndLocation.mockResolvedValue(null);
      mockUserLocationRepository.create.mockReturnValue(mockUserLocation);
      mockUserLocationRepository.save.mockResolvedValue(mockUserLocation);

      const result = await service.inviteUserToLocation('location-1', inviteDto, 'user-1');

      expect(result.message).toContain('assigned to location successfully');
      expect(mockUserLocationRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already assigned', async () => {
      const inviteDto = { email: 'user@example.com', role: LocationRoleType.OBSERVER };
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne
        .mockResolvedValueOnce({ ...mockUser, isAccountOwner: true })
        .mockResolvedValueOnce(mockUser);
      mockUserLocationRepository.findByUserAndLocation.mockResolvedValue(mockUserLocation);

      await expect(service.inviteUserToLocation('location-1', inviteDto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateUserLocationRole', () => {
    it('should update user role in location', async () => {
      const updateDto = { role: LocationRoleType.SUPERVISOR };
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isAccountOwner: true });
      mockUserLocationRepository.findByUserAndLocation.mockResolvedValue(mockUserLocation);
      mockUserLocationRepository.save.mockResolvedValue({
        ...mockUserLocation,
        role: LocationRoleType.SUPERVISOR,
      });

      const result = await service.updateUserLocationRole(
        'location-1',
        'user-1',
        updateDto,
        'admin-1',
      );

      expect(result.role).toBe(LocationRoleType.SUPERVISOR);
    });

    it('should throw NotFoundException if user not assigned to location', async () => {
      const updateDto = { role: LocationRoleType.SUPERVISOR };
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isAccountOwner: true });
      mockUserLocationRepository.findByUserAndLocation.mockResolvedValue(null);

      await expect(
        service.updateUserLocationRole('location-1', 'user-1', updateDto, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUserFromLocation', () => {
    it('should remove user from location', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isAccountOwner: true });
      mockUserLocationRepository.findByUserAndLocation.mockResolvedValue(mockUserLocation);
      mockUserLocationRepository.removeUserFromLocation.mockResolvedValue(undefined);

      const result = await service.removeUserFromLocation('location-1', 'user-1', 'admin-1');

      expect(result.message).toContain('removed from location successfully');
      expect(mockUserLocationRepository.removeUserFromLocation).toHaveBeenCalledWith(
        'user-1',
        'location-1',
      );
    });

    it('should throw NotFoundException if user not in location', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isAccountOwner: true });
      mockUserLocationRepository.findByUserAndLocation.mockResolvedValue(null);

      await expect(
        service.removeUserFromLocation('location-1', 'user-1', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
