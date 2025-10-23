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
    { name: 'users:create', description: 'Create new users', resource: 'users', action: 'create' },
    { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
    { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
    { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },

    // Role permissions
    { name: 'roles:create', description: 'Create new roles', resource: 'roles', action: 'create' },
    { name: 'roles:read', description: 'View roles', resource: 'roles', action: 'read' },
    { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
    { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },

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

    // Account permissions
    {
      name: 'accounts:create',
      description: 'Create new accounts',
      resource: 'accounts',
      action: 'create',
    },
    { name: 'accounts:read', description: 'View accounts', resource: 'accounts', action: 'read' },
    {
      name: 'accounts:update',
      description: 'Update accounts',
      resource: 'accounts',
      action: 'update',
    },
    {
      name: 'accounts:delete',
      description: 'Delete accounts',
      resource: 'accounts',
      action: 'delete',
    },

    // Plan permissions
    { name: 'plans:create', description: 'Create new plans', resource: 'plans', action: 'create' },
    { name: 'plans:read', description: 'View plans', resource: 'plans', action: 'read' },
    { name: 'plans:update', description: 'Update plans', resource: 'plans', action: 'update' },
    { name: 'plans:delete', description: 'Delete plans', resource: 'plans', action: 'delete' },

    // Subscription permissions
    {
      name: 'subscriptions:create',
      description: 'Create new subscriptions',
      resource: 'subscriptions',
      action: 'create',
    },
    {
      name: 'subscriptions:read',
      description: 'View subscriptions',
      resource: 'subscriptions',
      action: 'read',
    },
    {
      name: 'subscriptions:update',
      description: 'Update subscriptions',
      resource: 'subscriptions',
      action: 'update',
    },
    {
      name: 'subscriptions:delete',
      description: 'Delete subscriptions',
      resource: 'subscriptions',
      action: 'delete',
    },
    {
      name: 'subscriptions:cancel',
      description: 'Cancel subscriptions',
      resource: 'subscriptions',
      action: 'cancel',
    },
    {
      name: 'subscriptions:renew',
      description: 'Renew subscriptions',
      resource: 'subscriptions',
      action: 'renew',
    },

    // Payment permissions
    {
      name: 'payments:create',
      description: 'Create payments',
      resource: 'payments',
      action: 'create',
    },
    { name: 'payments:read', description: 'View payments', resource: 'payments', action: 'read' },
    {
      name: 'payments:update',
      description: 'Update payments',
      resource: 'payments',
      action: 'update',
    },
    {
      name: 'payments:refund',
      description: 'Process refunds',
      resource: 'payments',
      action: 'refund',
    },
    {
      name: 'payments:approve',
      description: 'Approve bank transfers',
      resource: 'payments',
      action: 'approve',
    },
    {
      name: 'payments:reject',
      description: 'Reject bank transfers',
      resource: 'payments',
      action: 'reject',
    },

    // Invoice permissions
    {
      name: 'invoices:create',
      description: 'Create invoices',
      resource: 'invoices',
      action: 'create',
    },
    { name: 'invoices:read', description: 'View invoices', resource: 'invoices', action: 'read' },
    {
      name: 'invoices:download',
      description: 'Download invoices',
      resource: 'invoices',
      action: 'download',
    },
    {
      name: 'invoices:send',
      description: 'Send invoices via email',
      resource: 'invoices',
      action: 'send',
    },

    // Currency permissions
    {
      name: 'currencies:create',
      description: 'Create currencies',
      resource: 'currencies',
      action: 'create',
    },
    {
      name: 'currencies:read',
      description: 'View currencies',
      resource: 'currencies',
      action: 'read',
    },
    {
      name: 'currencies:update',
      description: 'Update currencies',
      resource: 'currencies',
      action: 'update',
    },
    {
      name: 'currencies:delete',
      description: 'Delete currencies',
      resource: 'currencies',
      action: 'delete',
    },

    // Location permissions
    {
      name: 'locations:create',
      description: 'Create locations',
      resource: 'locations',
      action: 'create',
    },
    {
      name: 'locations:read',
      description: 'View locations',
      resource: 'locations',
      action: 'read',
    },
    {
      name: 'locations:update',
      description: 'Update locations',
      resource: 'locations',
      action: 'update',
    },
    {
      name: 'locations:delete',
      description: 'Delete locations',
      resource: 'locations',
      action: 'delete',
    },

    // Invitation permissions
    {
      name: 'invitations:create',
      description: 'Create invitations',
      resource: 'invitations',
      action: 'create',
    },
    {
      name: 'invitations:read',
      description: 'View invitations',
      resource: 'invitations',
      action: 'read',
    },
    {
      name: 'invitations:update',
      description: 'Update invitations',
      resource: 'invitations',
      action: 'update',
    },
    {
      name: 'invitations:delete',
      description: 'Delete invitations',
      resource: 'invitations',
      action: 'delete',
    },
    {
      name: 'invitations:resend',
      description: 'Resend invitations',
      resource: 'invitations',
      action: 'resend',
    },

    // Notification permissions
    {
      name: 'notifications:create',
      description: 'Create notifications',
      resource: 'notifications',
      action: 'create',
    },
    {
      name: 'notifications:read',
      description: 'View notifications',
      resource: 'notifications',
      action: 'read',
    },
    {
      name: 'notifications:update',
      description: 'Update notifications',
      resource: 'notifications',
      action: 'update',
    },
    {
      name: 'notifications:delete',
      description: 'Delete notifications',
      resource: 'notifications',
      action: 'delete',
    },
    {
      name: 'notifications:send',
      description: 'Send notifications',
      resource: 'notifications',
      action: 'send',
    },

    // Feature permissions
    { name: 'features:read', description: 'View features', resource: 'features', action: 'read' },
    {
      name: 'features:manage',
      description: 'Manage features',
      resource: 'features',
      action: 'manage',
    },

    // Reports permissions
    {
      name: 'reports:create',
      description: 'Create reports',
      resource: 'reports',
      action: 'create',
    },
    { name: 'reports:read', description: 'View reports', resource: 'reports', action: 'read' },
    {
      name: 'reports:export',
      description: 'Export reports',
      resource: 'reports',
      action: 'export',
    },

    // System Config permissions
    {
      name: 'system-config:read',
      description: 'View system settings',
      resource: 'system-config',
      action: 'read',
    },
    {
      name: 'system-config:update',
      description: 'Update system settings',
      resource: 'system-config',
      action: 'update',
    },

    // Audit permissions
    { name: 'audit:read', description: 'View audit logs', resource: 'audit', action: 'read' },
    { name: 'audit:export', description: 'Export audit logs', resource: 'audit', action: 'export' },

    // Admin permissions
    {
      name: 'admin:dashboard',
      description: 'Access admin dashboard',
      resource: 'admin',
      action: 'dashboard',
    },
    {
      name: 'admin:analytics',
      description: 'View analytics',
      resource: 'admin',
      action: 'analytics',
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
        // Users
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        // Roles & Permissions
        'roles:read',
        'permissions:read',
        // Accounts
        'accounts:create',
        'accounts:read',
        'accounts:update',
        'accounts:delete',
        // Plans
        'plans:read',
        'plans:update',
        // Subscriptions
        'subscriptions:create',
        'subscriptions:read',
        'subscriptions:update',
        'subscriptions:cancel',
        'subscriptions:renew',
        // Payments
        'payments:create',
        'payments:read',
        'payments:update',
        'payments:refund',
        'payments:approve',
        'payments:reject',
        // Invoices
        'invoices:read',
        'invoices:download',
        'invoices:send',
        // Currencies
        'currencies:read',
        'currencies:update',
        // Locations
        'locations:create',
        'locations:read',
        'locations:update',
        'locations:delete',
        // Invitations
        'invitations:create',
        'invitations:read',
        'invitations:resend',
        'invitations:delete',
        // Notifications
        'notifications:read',
        'notifications:send',
        // Features
        'features:read',
        // Reports
        'reports:create',
        'reports:read',
        'reports:export',
        // System Config
        'system-config:read',
        // Audit
        'audit:read',
        'audit:export',
        // Admin
        'admin:dashboard',
        'admin:analytics',
      ],
    },
    {
      name: RoleType.SUPERVISOR,
      description: 'Supervisor with limited management access',
      permissions: [
        // Users
        'users:read',
        'users:update',
        // Roles & Permissions
        'roles:read',
        'permissions:read',
        // Accounts
        'accounts:read',
        'accounts:update',
        // Plans
        'plans:read',
        // Subscriptions
        'subscriptions:read',
        'subscriptions:update',
        // Payments
        'payments:read',
        // Invoices
        'invoices:read',
        'invoices:download',
        // Currencies
        'currencies:read',
        // Locations
        'locations:read',
        'locations:update',
        // Invitations
        'invitations:read',
        'invitations:create',
        // Notifications
        'notifications:read',
        // Features
        'features:read',
        // Reports
        'reports:create',
        'reports:read',
        'reports:export',
        // Audit
        'audit:read',
      ],
    },
    {
      name: RoleType.OBSERVER,
      description: 'Observer with read-only access',
      permissions: [
        // Users
        'users:read',
        // Roles & Permissions
        'roles:read',
        'permissions:read',
        // Accounts
        'accounts:read',
        // Plans
        'plans:read',
        // Subscriptions
        'subscriptions:read',
        // Payments
        'payments:read',
        // Invoices
        'invoices:read',
        'invoices:download',
        // Currencies
        'currencies:read',
        // Locations
        'locations:read',
        // Invitations
        'invitations:read',
        // Notifications
        'notifications:read',
        // Features
        'features:read',
        // Reports
        'reports:read',
      ],
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
