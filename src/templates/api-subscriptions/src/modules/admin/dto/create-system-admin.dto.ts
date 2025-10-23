import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSystemAdminDto {
  @ApiProperty({
    description: 'Email of the new super admin',
    example: 'superadmin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the new super admin',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;
}
