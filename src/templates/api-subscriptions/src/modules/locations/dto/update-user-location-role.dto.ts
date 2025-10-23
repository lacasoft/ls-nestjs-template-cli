import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationRoleType } from '../entities/user-location.entity';

export class UpdateUserLocationRoleDto {
  @ApiProperty({
    enum: LocationRoleType,
    description: 'New role to assign to the user in this location',
    example: LocationRoleType.SUPERVISOR,
  })
  @IsEnum(LocationRoleType)
  role: LocationRoleType;
}
