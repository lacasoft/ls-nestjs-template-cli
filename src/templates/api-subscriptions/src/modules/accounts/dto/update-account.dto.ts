import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsObject } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Account name',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Account description',
    example: 'Technology company focused on innovation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Account logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Account settings (JSON object)',
    example: { theme: 'dark', notifications: true },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
