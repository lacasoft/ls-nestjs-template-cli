import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EnableMfaDto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'MySecurePassword123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
