import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from '../../../../src/modules/locations/locations.controller';
import { LocationsService } from '../../../../src/modules/locations/locations.service';
import { UsersService } from '../../../../src/modules/users/users.service';
import { Location } from '../../../../src/modules/locations/entities/location.entity';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('LocationsController', () => {
  let controller: LocationsController;
  let locationsService: LocationsService;
  let usersService: UsersService;

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

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    accountId: 'account-1',
  };

  const mockLocationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    locationsService = module.get<LocationsService>(LocationsService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    const req = { user: { userId: 'user-1' } };

    it('should create a location successfully', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockLocationsService.create.mockResolvedValue(mockLocation);

      const result = await controller.create(createDto, req);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(locationsService.create).toHaveBeenCalledWith(createDto, 'account-1');
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if user has no account', async () => {
      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.create(createDto, req)).rejects.toThrow(NotFoundException);
      await expect(controller.create(createDto, req)).rejects.toThrow(
        'User has no account assigned',
      );
    });

    it('should propagate service errors', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const error = new ForbiddenException('Only tenant accounts can create locations');
      mockLocationsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    const req = { user: { userId: 'user-1' } };

    it('should return all locations for user account', async () => {
      const locations = [mockLocation, { ...mockLocation, id: 'location-2' }];
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockLocationsService.findAll.mockResolvedValue(locations);

      const result = await controller.findAll(req);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(locationsService.findAll).toHaveBeenCalledWith('account-1');
      expect(result).toEqual(locations);
    });

    it('should throw NotFoundException if user has no account', async () => {
      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.findAll(req)).rejects.toThrow(NotFoundException);
      await expect(controller.findAll(req)).rejects.toThrow('User has no account assigned');
    });

    it('should return empty array when no locations exist', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockLocationsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(req);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const req = { user: { userId: 'user-1' } };

    it('should return a location by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockLocationsService.findOne.mockResolvedValue(mockLocation);

      const result = await controller.findOne('location-1', req);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(locationsService.findOne).toHaveBeenCalledWith('location-1', 'account-1');
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if user has no account', async () => {
      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.findOne('location-1', req)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne('location-1', req)).rejects.toThrow(
        'User has no account assigned',
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const error = new NotFoundException('Location not found');
      mockLocationsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('location-999', req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Office', city: 'Boston' };
    const req = { user: { userId: 'user-1' } };

    it('should update a location successfully', async () => {
      const updatedLocation = { ...mockLocation, ...updateDto };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockLocationsService.update.mockResolvedValue(updatedLocation);

      const result = await controller.update('location-1', updateDto, req);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(locationsService.update).toHaveBeenCalledWith('location-1', updateDto, 'account-1');
      expect(result).toEqual(updatedLocation);
    });

    it('should throw NotFoundException if user has no account', async () => {
      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.update('location-1', updateDto, req)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.update('location-1', updateDto, req)).rejects.toThrow(
        'User has no account assigned',
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const error = new NotFoundException('Location not found');
      mockLocationsService.update.mockRejectedValue(error);

      await expect(controller.update('location-999', updateDto, req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const req = { user: { userId: 'user-1' } };

    it('should delete a location successfully', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockLocationsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('location-1', req);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(locationsService.remove).toHaveBeenCalledWith('location-1', 'account-1');
      expect(result).toEqual({ message: 'Location deleted successfully' });
    });

    it('should throw NotFoundException if user has no account', async () => {
      const userWithoutAccount = { ...mockUser, accountId: null };
      mockUsersService.findOne.mockResolvedValue(userWithoutAccount);

      await expect(controller.remove('location-1', req)).rejects.toThrow(NotFoundException);
      await expect(controller.remove('location-1', req)).rejects.toThrow(
        'User has no account assigned',
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const error = new NotFoundException('Location not found');
      mockLocationsService.remove.mockRejectedValue(error);

      await expect(controller.remove('location-999', req)).rejects.toThrow(NotFoundException);
    });
  });
});
