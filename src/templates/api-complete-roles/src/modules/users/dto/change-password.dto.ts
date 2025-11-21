import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidatePassword } from '../../../common/decorators/password-validation.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPass123!',
    format: 'password',
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ValidatePassword({
    description: 'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'NewStrongPass123!',
  })
  newPassword: string;
}
