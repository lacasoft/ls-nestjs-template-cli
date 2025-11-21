import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidatePassword } from '../../../common/decorators/password-validation.decorator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ValidatePassword({
    description: 'User password',
    example: 'Password123!',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Role IDs to assign (optional)',
    example: ['uuid-role-1', 'uuid-role-2'],
    required: false,
    type: [String],
  })
  @IsOptional()
  roleIds?: string[];
}
