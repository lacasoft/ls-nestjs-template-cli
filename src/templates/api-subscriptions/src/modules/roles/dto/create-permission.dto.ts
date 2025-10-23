import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name (unique identifier)',
    example: 'users:create',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Allows creating new users',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Resource this permission applies to',
    example: 'users',
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({
    description: 'Action this permission allows',
    example: 'create',
  })
  @IsOptional()
  @IsString()
  action?: string;
}
