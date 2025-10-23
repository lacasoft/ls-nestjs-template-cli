import { Test, TestingModule } from '@nestjs/testing';
import { LocationUsersController } from '../../../../src/modules/locations/location-users.controller';
import { LocationUsersService } from '../../../../src/modules/locations/location-users.service';
import { LocationRoleType } from '../../../../src/modules/locations/entities/user-location.entity';

describe('LocationUsersController', () => {
  let controller: LocationUsersController;
  let service: LocationUsersService;

  const mockUserLocation = {
    id: 'user-location-1',
    userId: 'user-1',
    locationId: 'location-1',
    role: LocationRoleType.OBSERVER,
    isActive: true,
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
  };

  const mockService = {
    getUsersByLocation: jest.fn(),
    inviteUserToLocation: jest.fn(),
    updateUserLocationRole: jest.fn(),
    removeUserFromLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationUsersController],
      providers: [
        {
          provide: LocationUsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LocationUsersController>(LocationUsersController);
    service = module.get<LocationUsersService>(LocationUsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsersByLocation', () => {
    it('should return users for a location', async () => {
      const req = { user: { userId: 'user-1' } };
      mockService.getUsersByLocation.mockResolvedValue([mockUserLocation]);

      const result = await controller.getUsersByLocation('location-1', req);

      expect(service.getUsersByLocation).toHaveBeenCalledWith('location-1', 'user-1');
      expect(result).toEqual([mockUserLocation]);
    });
  });

  describe('inviteUserToLocation', () => {
    it('should invite user to location', async () => {
      const req = { user: { userId: 'user-1' } };
      const inviteDto = {
        email: 'newuser@example.com',
        role: LocationRoleType.OBSERVER,
      };
      const response = { message: 'User invited successfully', invitationId: 'inv-1' };
      mockService.inviteUserToLocation.mockResolvedValue(response);

      const result = await controller.inviteUserToLocation('location-1', inviteDto, req);

      expect(service.inviteUserToLocation).toHaveBeenCalledWith('location-1', inviteDto, 'user-1');
      expect(result).toEqual(response);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role in location', async () => {
      const req = { user: { userId: 'admin-1' } };
      const updateDto = { role: LocationRoleType.SUPERVISOR };
      const updatedUserLocation = { ...mockUserLocation, role: LocationRoleType.SUPERVISOR };
      mockService.updateUserLocationRole.mockResolvedValue(updatedUserLocation);

      const result = await controller.updateUserRole('location-1', 'user-1', updateDto, req);

      expect(service.updateUserLocationRole).toHaveBeenCalledWith(
        'location-1',
        'user-1',
        updateDto,
        'admin-1',
      );
      expect(result.role).toBe(LocationRoleType.SUPERVISOR);
    });
  });

  describe('removeUserFromLocation', () => {
    it('should remove user from location', async () => {
      const req = { user: { userId: 'admin-1' } };
      const response = { message: 'User removed from location successfully' };
      mockService.removeUserFromLocation.mockResolvedValue(response);

      const result = await controller.removeUserFromLocation('location-1', 'user-1', req);

      expect(service.removeUserFromLocation).toHaveBeenCalledWith(
        'location-1',
        'user-1',
        'admin-1',
      );
      expect(result).toEqual(response);
    });
  });
});
