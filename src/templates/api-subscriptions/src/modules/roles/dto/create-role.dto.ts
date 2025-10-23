import { IsEnum, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../entities/role.entity';

export class CreateRoleDto {
  @ApiProperty({
    enum: RoleType,
    description: 'Role type',
    example: RoleType.OBSERVER,
  })
  @IsEnum(RoleType)
  name: RoleType;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Can view data but cannot modify',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of permission IDs to assign to this role',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}
