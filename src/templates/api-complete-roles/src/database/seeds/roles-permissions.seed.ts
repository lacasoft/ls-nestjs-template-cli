import { DataSource } from 'typeorm';
import { Role, RoleType } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/roles/entities/permission.entity';

interface PermissionData {
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RoleData {
  name: RoleType;
  description: string;
  permissions: string[];
}

export async function seedRolesAndPermissions(dataSource: DataSource) {
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);

  console.log('🌱 Seeding permissions...');

  // Define all permissions
  const permissionsData: PermissionData[] = [
    // User permissions
    {
      name: 'users:create',
      description: 'Create new users',
      resource: 'users',
      action: 'create',
    },
    {
      name: 'users:read',
      description: 'View users',
      resource: 'users',
      action: 'read',
    },
    {
      name: 'users:update',
      description: 'Update users',
      resource: 'users',
      action: 'update',
    },
    {
      name: 'users:delete',
      description: 'Delete users',
      resource: 'users',
      action: 'delete',
    },

    // Role permissions
    {
      name: 'roles:create',
      description: 'Create new roles',
      resource: 'roles',
      action: 'create',
    },
    {
      name: 'roles:read',
      description: 'View roles',
      resource: 'roles',
      action: 'read',
    },
    {
      name: 'roles:update',
      description: 'Update roles',
      resource: 'roles',
      action: 'update',
    },
    {
      name: 'roles:delete',
      description: 'Delete roles',
      resource: 'roles',
      action: 'delete',
    },

    // Permission permissions
    {
      name: 'permissions:create',
      description: 'Create new permissions',
      resource: 'permissions',
      action: 'create',
    },
    {
      name: 'permissions:read',
      description: 'View permissions',
      resource: 'permissions',
      action: 'read',
    },
    {
      name: 'permissions:update',
      description: 'Update permissions',
      resource: 'permissions',
      action: 'update',
    },
    {
      name: 'permissions:delete',
      description: 'Delete permissions',
      resource: 'permissions',
      action: 'delete',
    },

    // Reports permissions
    {
      name: 'reports:create',
      description: 'Create reports',
      resource: 'reports',
      action: 'create',
    },
    {
      name: 'reports:read',
      description: 'View reports',
      resource: 'reports',
      action: 'read',
    },
    {
      name: 'reports:export',
      description: 'Export reports',
      resource: 'reports',
      action: 'export',
    },

    // Settings permissions
    {
      name: 'settings:read',
      description: 'View system settings',
      resource: 'settings',
      action: 'read',
    },
    {
      name: 'settings:update',
      description: 'Update system settings',
      resource: 'settings',
      action: 'update',
    },

    // Audit permissions
    {
      name: 'audit:read',
      description: 'View audit logs',
      resource: 'audit',
      action: 'read',
    },
  ];

  // Create or update permissions
  const permissions: Permission[] = [];
  for (const permData of permissionsData) {
    let permission = await permissionRepository.findOne({
      where: { name: permData.name },
    });

    if (!permission) {
      permission = permissionRepository.create(permData);
      await permissionRepository.save(permission);
      console.log(`   ✅ Permission created: ${permData.name}`);
    } else {
      console.log(`   ⏭️  Permission exists: ${permData.name}`);
    }
    permissions.push(permission);
  }

  // Create a map for easy permission lookup
  const permissionMap = new Map(permissions.map((p) => [p.name, p]));

  console.log('🌱 Seeding roles...');

  // Define roles with their permissions
  const rolesData: RoleData[] = [
    {
      name: RoleType.SUPER_ADMIN,
      description: 'Super administrator with full system access',
      permissions: permissionsData.map((p) => p.name), // All permissions
    },
    {
      name: RoleType.ADMIN,
      description: 'Administrator with most system access',
      permissions: [
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        'roles:read',
        'permissions:read',
        'reports:create',
        'reports:read',
        'reports:export',
        'settings:read',
        'audit:read',
      ],
    },
    {
      name: RoleType.SUPERVISOR,
      description: 'Supervisor with limited management access',
      permissions: [
        'users:read',
        'users:update',
        'roles:read',
        'permissions:read',
        'reports:create',
        'reports:read',
        'reports:export',
        'audit:read',
      ],
    },
    {
      name: RoleType.OBSERVER,
      description: 'Observer with read-only access',
      permissions: ['users:read', 'roles:read', 'permissions:read', 'reports:read'],
    },
  ];

  // Create or update roles
  for (const roleData of rolesData) {
    let role = await roleRepository.findOne({
      where: { name: roleData.name },
      relations: ['permissions'],
    });

    const rolePermissions = roleData.permissions
      .map((permName) => permissionMap.get(permName))
      .filter((p): p is Permission => p !== undefined);

    if (!role) {
      role = roleRepository.create({
        name: roleData.name,
        description: roleData.description,
        permissions: rolePermissions,
      });
      await roleRepository.save(role);
      console.log(
        `   ✅ Role created: ${roleData.name} with ${rolePermissions.length} permissions`,
      );
    } else {
      // Update existing role's permissions
      role.description = roleData.description;
      role.permissions = rolePermissions;
      await roleRepository.save(role);
      console.log(
        `   🔄 Role updated: ${roleData.name} with ${rolePermissions.length} permissions`,
      );
    }
  }

  console.log('✅ Roles and permissions seeding completed');
}
