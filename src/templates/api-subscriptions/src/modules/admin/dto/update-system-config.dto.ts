import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({
    description: 'Default currency for the system (ISO 4217 code)',
    example: 'USD',
    enum: ['USD', 'MXN', 'EUR', 'GBP', 'CAD', 'BRL', 'ARS', 'COP', 'CLP', 'PEN'],
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @IsIn(['USD', 'MXN', 'EUR', 'GBP', 'CAD', 'BRL', 'ARS', 'COP', 'CLP', 'PEN'], {
    message:
      'Currency must be a valid ISO code: USD, MXN, EUR, GBP, CAD, BRL, ARS, COP, CLP, or PEN',
  })
  defaultCurrency?: string;

  @ApiPropertyOptional({
    description: 'Default trial days for new accounts',
    example: 14,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Trial days must be at least 1 day' })
  @Max(90, { message: 'Trial days cannot exceed 90 days' })
  trialDaysDefault?: number;

  @ApiPropertyOptional({
    description: 'Enable/disable maintenance mode',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum failed login attempts before account lockout',
    example: 5,
    minimum: 3,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(3, { message: 'Max failed login attempts must be at least 3' })
  @Max(10, { message: 'Max failed login attempts cannot exceed 10' })
  maxFailedLoginAttempts?: number;
}
