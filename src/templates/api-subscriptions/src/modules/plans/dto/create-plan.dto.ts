import { IsString, IsNumber, IsEnum, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanInterval, PlanStatus } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Professional',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique plan code',
    example: 'PLAN_PRO',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Perfect for growing businesses',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Plan price',
    example: 49.99,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    enum: PlanInterval,
    description: 'Billing interval',
    example: PlanInterval.MONTHLY,
    default: PlanInterval.MONTHLY,
  })
  @IsOptional()
  @IsEnum(PlanInterval)
  interval?: PlanInterval;

  @ApiPropertyOptional({
    description: 'Interval count multiplier',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalCount?: number;

  @ApiPropertyOptional({
    description: 'Trial days (null for no trial)',
    example: 14,
  })
  @IsOptional()
  @IsNumber()
  trialDays?: number;

  @ApiPropertyOptional({
    description: 'Maximum users allowed (-1 for unlimited)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'Maximum locations allowed (-1 for unlimited, 0 for none)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  maxLocations?: number;

  @ApiPropertyOptional({
    description: 'List of features included',
    example: ['API Access', 'Priority Support', 'Custom Branding'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional({
    enum: PlanStatus,
    description: 'Plan status',
    example: PlanStatus.ACTIVE,
    default: PlanStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
