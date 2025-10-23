import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class DisableMfaDto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'MySecurePassword123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Current TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
