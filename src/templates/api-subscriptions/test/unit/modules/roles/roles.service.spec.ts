import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from '../../../../src/modules/roles/roles.service';
import { Role, RoleType } from '../../../../src/modules/roles/entities/role.entity';
import { Permission } from '../../../../src/modules/roles/entities/permission.entity';
import { CreateRoleDto } from '../../../../src/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from '../../../../src/modules/roles/dto/update-role.dto';
import { CreatePermissionDto } from '../../../../src/modules/roles/dto/create-permission.dto';
import { UpdatePermissionDto } from '../../../../src/modules/roles/dto/update-permission.dto';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockPermissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    it('should create a role successfully without permissions', async () => {
      const createRoleDto: CreateRoleDto = {
        name: RoleType.ADMIN,
        description: 'Administrator role',
      };

      const role = {
        id: '1',
        ...createRoleDto,
        permissions: [],
        users: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockReturnValue(role);
      mockRoleRepository.save.mockResolvedValue(role);

      const result = await service.createRole(createRoleDto);

      expect(result).toEqual(role);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: createRoleDto.name },
      });
      expect(mockRoleRepository.create).toHaveBeenCalled();
      expect(mockRoleRepository.save).toHaveBeenCalledWith(role);
    });

    it('should create a role with permissions', async () => {
      const permission1 = {
        id: 'perm1',
        name: 'users:read',
      } as Permission;
      const permission2 = {
        id: 'perm2',
        name: 'users:create',
      } as Permission;

      const createRoleDto: CreateRoleDto = {
        name: RoleType.ADMIN,
        description: 'Administrator role',
        permissionIds: ['perm1', 'perm2'],
      };

      const role = {
        id: '1',
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: [permission1, permission2],
      } as Role;

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockReturnValue(role);
      mockPermissionRepository.findBy.mockResolvedValue([permission1, permission2]);
      mockRoleRepository.save.mockResolvedValue(role);

      const result = await service.createRole(createRoleDto);

      expect(result).toEqual(role);
      expect(mockPermissionRepository.findBy).toHaveBeenCalledWith({
        id: expect.anything(),
      });
    });

    it('should throw ConflictException if role already exists', async () => {
      const createRoleDto: CreateRoleDto = {
        name: RoleType.ADMIN,
        description: 'Administrator role',
      };

      mockRoleRepository.findOne.mockResolvedValue({ id: '1' } as Role);

      await expect(service.createRole(createRoleDto)).rejects.toThrow(ConflictException);
      expect(mockRoleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllRoles', () => {
    it('should return an array of roles with permissions', async () => {
      const roles = [
        {
          id: '1',
          name: RoleType.ADMIN,
          description: 'Admin role',
          permissions: [],
          users: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: RoleType.SUPERVISOR,
          description: 'Supervisor role',
          permissions: [],
          users: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Role[];

      mockRoleRepository.find.mockResolvedValue(roles);

      const result = await service.findAllRoles();

      expect(result).toEqual(roles);
      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        relations: ['permissions'],
      });
    });
  });

  describe('findRoleById', () => {
    it('should return a role by id', async () => {
      const role = {
        id: '1',
        name: RoleType.ADMIN,
        description: 'Admin role',
        permissions: [],
        users: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      mockRoleRepository.findOne.mockResolvedValue(role);

      const result = await service.findRoleById('1');

      expect(result).toEqual(role);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['permissions'],
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findRoleById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      const existingRole = {
        id: '1',
        name: RoleType.ADMIN,
        description: 'Old description',
        permissions: [],
        users: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      const updateRoleDto: UpdateRoleDto = {
        description: 'New description',
      };

      const updatedRole = {
        ...existingRole,
        description: updateRoleDto.description,
      };

      mockRoleRepository.findOne.mockResolvedValue(existingRole);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.updateRole('1', updateRoleDto);

      expect(result.description).toEqual(updateRoleDto.description);
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing role name', async () => {
      const existingRole = {
        id: '1',
        name: RoleType.ADMIN,
      } as Role;

      const updateRoleDto: UpdateRoleDto = {
        name: RoleType.SUPERVISOR,
      };

      mockRoleRepository.findOne
        .mockResolvedValueOnce(existingRole) // First call for findRoleById
        .mockResolvedValueOnce({ id: '2', name: RoleType.SUPERVISOR } as Role); // Second call for name check

      await expect(service.updateRole('1', updateRoleDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      const role = {
        id: '1',
        name: RoleType.ADMIN,
        description: 'Admin role',
        permissions: [],
        users: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockRoleRepository.remove.mockResolvedValue(role);

      await service.deleteRole('1');

      expect(mockRoleRepository.remove).toHaveBeenCalledWith(role);
    });

    it('should throw NotFoundException when deleting non-existent role', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRole('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to a role successfully', async () => {
      const role = {
        id: '1',
        name: RoleType.ADMIN,
        description: 'Admin role',
        permissions: [],
        users: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      const permissions = [
        { id: 'perm1', name: 'users:read' },
        { id: 'perm2', name: 'users:create' },
      ] as Permission[];

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockPermissionRepository.findBy.mockResolvedValue(permissions);
      mockRoleRepository.save.mockResolvedValue({
        ...role,
        permissions,
      });

      const result = await service.assignPermissions('1', ['perm1', 'perm2']);

      expect(result.permissions).toEqual(permissions);
      expect(mockPermissionRepository.findBy).toHaveBeenCalled();
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when some permissions not found', async () => {
      const role = {
        id: '1',
        name: RoleType.ADMIN,
        description: 'Admin role',
        permissions: [],
        users: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockPermissionRepository.findBy.mockResolvedValue([{ id: 'perm1', name: 'users:read' }]); // Only 1 found instead of 2

      await expect(service.assignPermissions('1', ['perm1', 'perm2'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from a role successfully', async () => {
      const permissions = [
        { id: 'perm1', name: 'users:read' },
        { id: 'perm2', name: 'users:create' },
        { id: 'perm3', name: 'users:update' },
      ] as Permission[];

      const role = {
        id: '1',
        name: RoleType.ADMIN,
        permissions: permissions,
      } as Role;

      mockRoleRepository.findOne.mockResolvedValue(role);
      mockRoleRepository.save.mockResolvedValue({
        ...role,
        permissions: [permissions[0]],
      });

      const result = await service.removePermissions('1', ['perm2', 'perm3']);

      expect(mockRoleRepository.save).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(1);
    });
  });

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      const createPermissionDto: CreatePermissionDto = {
        name: 'users:read',
        description: 'Read users',
        resource: 'users',
        action: 'read',
      };

      const permission = {
        id: '1',
        ...createPermissionDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Permission;

      mockPermissionRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.create.mockReturnValue(permission);
      mockPermissionRepository.save.mockResolvedValue(permission);

      const result = await service.createPermission(createPermissionDto);

      expect(result).toEqual(permission);
      expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
        where: { name: createPermissionDto.name },
      });
    });

    it('should throw ConflictException if permission already exists', async () => {
      const createPermissionDto: CreatePermissionDto = {
        name: 'users:read',
        description: 'Read users',
        resource: 'users',
        action: 'read',
      };

      mockPermissionRepository.findOne.mockResolvedValue({
        id: '1',
      } as Permission);

      await expect(service.createPermission(createPermissionDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllPermissions', () => {
    it('should return an array of permissions', async () => {
      const permissions = [
        { id: '1', name: 'users:read' },
        { id: '2', name: 'users:create' },
      ] as Permission[];

      mockPermissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAllPermissions();

      expect(result).toEqual(permissions);
      expect(mockPermissionRepository.find).toHaveBeenCalled();
    });
  });

  describe('findPermissionById', () => {
    it('should return a permission by id', async () => {
      const permission = {
        id: '1',
        name: 'users:read',
      } as Permission;

      mockPermissionRepository.findOne.mockResolvedValue(permission);

      const result = await service.findPermissionById('1');

      expect(result).toEqual(permission);
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPermissionRepository.findOne.mockResolvedValue(null);

      await expect(service.findPermissionById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePermission', () => {
    it('should update a permission successfully', async () => {
      const existingPermission = {
        id: '1',
        name: 'users:read',
        description: 'Old description',
      } as Permission;

      const updatePermissionDto: UpdatePermissionDto = {
        description: 'New description',
      };

      mockPermissionRepository.findOne.mockResolvedValue(existingPermission);
      mockPermissionRepository.save.mockResolvedValue({
        ...existingPermission,
        ...updatePermissionDto,
      });

      const result = await service.updatePermission('1', updatePermissionDto);

      expect(result.description).toEqual(updatePermissionDto.description);
    });

    it('should throw ConflictException when updating to existing permission name', async () => {
      const existingPermission = {
        id: '1',
        name: 'users:read',
      } as Permission;

      const updatePermissionDto: UpdatePermissionDto = {
        name: 'users:create',
      };

      mockPermissionRepository.findOne
        .mockResolvedValueOnce(existingPermission)
        .mockResolvedValueOnce({ id: '2', name: 'users:create' } as Permission);

      await expect(service.updatePermission('1', updatePermissionDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deletePermission', () => {
    it('should delete a permission successfully', async () => {
      const permission = {
        id: '1',
        name: 'users:read',
      } as Permission;

      mockPermissionRepository.findOne.mockResolvedValue(permission);
      mockPermissionRepository.remove.mockResolvedValue(permission);

      await service.deletePermission('1');

      expect(mockPermissionRepository.remove).toHaveBeenCalledWith(permission);
    });

    it('should throw NotFoundException when deleting non-existent permission', async () => {
      mockPermissionRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePermission('999')).rejects.toThrow(NotFoundException);
    });
  });
});
