import { ApiProperty } from '@nestjs/swagger';

export class PermissionItemDto {
  @ApiProperty({
    description: 'Permission name in format resource:action',
    example: 'users:read',
  })
  name: string;

  @ApiProperty({
    description: 'Human-readable description of the permission',
    example: 'Allows reading user information',
  })
  description?: string;

  @ApiProperty({
    description: 'Resource this permission applies to',
    example: 'users',
  })
  resource?: string;

  @ApiProperty({
    description: 'Action this permission allows',
    example: 'read',
  })
  action?: string;
}

export class RoleInfoDto {
  @ApiProperty({
    description: 'Role name',
    example: 'admin',
  })
  name: string;

  @ApiProperty({
    description: 'Human-readable role description',
    example: 'Administrator with full system access',
  })
  description?: string;
}

export class UserPermissionsResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'List of roles assigned to the user',
    type: [RoleInfoDto],
  })
  roles: RoleInfoDto[];

  @ApiProperty({
    description: 'List of all permissions granted to the user',
    type: [PermissionItemDto],
  })
  permissions: PermissionItemDto[];

  @ApiProperty({
    description: 'Array of permission names for quick lookup',
    example: ['users:read', 'users:write', 'events:read'],
  })
  permissionNames: string[];

  @ApiProperty({
    description: 'Permissions grouped by resource',
    example: {
      users: ['read', 'write', 'delete'],
      events: ['read', 'write'],
    },
  })
  permissionsByResource: Record<string, string[]>;

  @ApiProperty({
    description: 'Timestamp when this data was generated',
    example: '2025-11-20T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Indicates if this response was served from cache',
    example: false,
  })
  cached: boolean;
}
