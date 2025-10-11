import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../../../../src/modules/roles/roles.controller';
import { RolesService } from '../../../../src/modules/roles/roles.service';
import { CreateRoleDto } from '../../../../src/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from '../../../../src/modules/roles/dto/update-role.dto';
import { CreatePermissionDto } from '../../../../src/modules/roles/dto/create-permission.dto';
import { UpdatePermissionDto } from '../../../../src/modules/roles/dto/update-permission.dto';
import { AssignPermissionsDto } from '../../../../src/modules/roles/dto/assign-permissions.dto';
import { Role, RoleType } from '../../../../src/modules/roles/entities/role.entity';
import { Permission } from '../../../../src/modules/roles/entities/permission.entity';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRole: Partial<Role> = {
    id: '1',
    name: RoleType.ADMIN,
    description: 'Admin role',
    permissions: [],
    users: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermission: Partial<Permission> = {
    id: '1',
    name: 'users:read',
    description: 'Read users',
    resource: 'users',
    action: 'read',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRolesService = {
    createRole: jest.fn(),
    findAllRoles: jest.fn(),
    findRoleById: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    assignPermissions: jest.fn(),
    removePermissions: jest.fn(),
    createPermission: jest.fn(),
    findAllPermissions: jest.fn(),
    findPermissionById: jest.fn(),
    updatePermission: jest.fn(),
    deletePermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Roles endpoints', () => {
    describe('createRole', () => {
      it('should create a role successfully', async () => {
        const createRoleDto: CreateRoleDto = {
          name: RoleType.ADMIN,
          description: 'Admin role',
        };

        mockRolesService.createRole.mockResolvedValue(mockRole);

        const result = await controller.createRole(createRoleDto);

        expect(result).toEqual(mockRole);
        expect(service.createRole).toHaveBeenCalledWith(createRoleDto);
        expect(service.createRole).toHaveBeenCalledTimes(1);
      });
    });

    describe('findAllRoles', () => {
      it('should return all roles', async () => {
        const roles = [mockRole, { ...mockRole, id: '2', name: RoleType.SUPERVISOR }];
        mockRolesService.findAllRoles.mockResolvedValue(roles);

        const result = await controller.findAllRoles();

        expect(result).toEqual(roles);
        expect(service.findAllRoles).toHaveBeenCalledTimes(1);
      });
    });

    describe('findRoleById', () => {
      it('should return a role by id', async () => {
        mockRolesService.findRoleById.mockResolvedValue(mockRole);

        const result = await controller.findRoleById('1');

        expect(result).toEqual(mockRole);
        expect(service.findRoleById).toHaveBeenCalledWith('1');
      });
    });

    describe('updateRole', () => {
      it('should update a role', async () => {
        const updateRoleDto: UpdateRoleDto = {
          description: 'Updated description',
        };

        const updatedRole = { ...mockRole, ...updateRoleDto };
        mockRolesService.updateRole.mockResolvedValue(updatedRole);

        const result = await controller.updateRole('1', updateRoleDto);

        expect(result).toEqual(updatedRole);
        expect(service.updateRole).toHaveBeenCalledWith('1', updateRoleDto);
      });
    });

    describe('deleteRole', () => {
      it('should delete a role', async () => {
        mockRolesService.deleteRole.mockResolvedValue(undefined);

        await controller.deleteRole('1');

        expect(service.deleteRole).toHaveBeenCalledWith('1');
      });
    });

    describe('assignPermissions', () => {
      it('should assign permissions to a role', async () => {
        const assignPermissionsDto: AssignPermissionsDto = {
          permissionIds: ['perm1', 'perm2'],
        };

        const roleWithPermissions = {
          ...mockRole,
          permissions: [mockPermission, { ...mockPermission, id: 'perm2' }],
        };

        mockRolesService.assignPermissions.mockResolvedValue(roleWithPermissions);

        const result = await controller.assignPermissions('1', assignPermissionsDto);

        expect(result).toEqual(roleWithPermissions);
        expect(service.assignPermissions).toHaveBeenCalledWith(
          '1',
          assignPermissionsDto.permissionIds,
        );
      });
    });

    describe('removePermissions', () => {
      it('should remove permissions from a role', async () => {
        const assignPermissionsDto: AssignPermissionsDto = {
          permissionIds: ['perm1'],
        };

        const roleWithoutPermissions = { ...mockRole, permissions: [] };

        mockRolesService.removePermissions.mockResolvedValue(roleWithoutPermissions);

        const result = await controller.removePermissions('1', assignPermissionsDto);

        expect(result).toEqual(roleWithoutPermissions);
        expect(service.removePermissions).toHaveBeenCalledWith(
          '1',
          assignPermissionsDto.permissionIds,
        );
      });
    });
  });

  describe('Permissions endpoints', () => {
    describe('createPermission', () => {
      it('should create a permission successfully', async () => {
        const createPermissionDto: CreatePermissionDto = {
          name: 'users:read',
          description: 'Read users',
          resource: 'users',
          action: 'read',
        };

        mockRolesService.createPermission.mockResolvedValue(mockPermission);

        const result = await controller.createPermission(createPermissionDto);

        expect(result).toEqual(mockPermission);
        expect(service.createPermission).toHaveBeenCalledWith(createPermissionDto);
      });
    });

    describe('findAllPermissions', () => {
      it('should return all permissions', async () => {
        const permissions = [mockPermission, { ...mockPermission, id: '2', name: 'users:write' }];
        mockRolesService.findAllPermissions.mockResolvedValue(permissions);

        const result = await controller.findAllPermissions();

        expect(result).toEqual(permissions);
        expect(service.findAllPermissions).toHaveBeenCalledTimes(1);
      });
    });

    describe('findPermissionById', () => {
      it('should return a permission by id', async () => {
        mockRolesService.findPermissionById.mockResolvedValue(mockPermission);

        const result = await controller.findPermissionById('1');

        expect(result).toEqual(mockPermission);
        expect(service.findPermissionById).toHaveBeenCalledWith('1');
      });
    });

    describe('updatePermission', () => {
      it('should update a permission', async () => {
        const updatePermissionDto: UpdatePermissionDto = {
          description: 'Updated permission description',
        };

        const updatedPermission = { ...mockPermission, ...updatePermissionDto };
        mockRolesService.updatePermission.mockResolvedValue(updatedPermission);

        const result = await controller.updatePermission('1', updatePermissionDto);

        expect(result).toEqual(updatedPermission);
        expect(service.updatePermission).toHaveBeenCalledWith('1', updatePermissionDto);
      });
    });

    describe('deletePermission', () => {
      it('should delete a permission', async () => {
        mockRolesService.deletePermission.mockResolvedValue(undefined);

        await controller.deletePermission('1');

        expect(service.deletePermission).toHaveBeenCalledWith('1');
      });
    });
  });
});
