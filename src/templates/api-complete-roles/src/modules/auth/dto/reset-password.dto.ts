import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidatePassword } from '../../../common/decorators/password-validation.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received by email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString()
  token: string;

  @ValidatePassword({
    description: 'New user password',
    example: 'NewPassword123!',
  })
  newPassword: string;
}
