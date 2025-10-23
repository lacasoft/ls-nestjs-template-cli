import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyMfaLoginDto {
  @ApiProperty({
    description: 'Temporary token received from login endpoint',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
