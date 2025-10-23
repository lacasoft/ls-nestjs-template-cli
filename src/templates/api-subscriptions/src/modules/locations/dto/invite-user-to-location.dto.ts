import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationRoleType } from '../entities/user-location.entity';

export class InviteUserToLocationDto {
  @ApiProperty({
    description: 'Email of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: LocationRoleType,
    description: 'Role to assign to the user in this location',
    example: LocationRoleType.OBSERVER,
  })
  @IsEnum(LocationRoleType)
  role: LocationRoleType;

  @ApiPropertyOptional({
    description: 'Role ID from the roles system (optional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Optional message for the invitation email',
    example: 'Welcome to our team at the Central Office location',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
