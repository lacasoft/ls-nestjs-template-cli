import { IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'firstName must be at least 2 characters' })
  @MaxLength(50, { message: 'firstName cannot be more than 50 characters' })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'lastName must be at least 2 characters' })
  @MaxLength(50, { message: 'lastName cannot be more than 50 characters' })
  lastName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phone must be in international format (+[country code][number])',
  })
  phone?: string;
}
