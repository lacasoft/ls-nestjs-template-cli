import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
