import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UpgradeTimingType {
  IMMEDIATE = 'immediate', // Upgrade immediately (prorated)
  NEXT_PERIOD = 'next_period', // Upgrade at next billing cycle
}

export class UpgradeSubscriptionDto {
  @ApiPropertyOptional({
    description:
      'UUID of the subscription to upgrade (optional, will use current user subscription if not provided)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({
    description: 'UUID of the new plan (must be higher tier)',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  newPlanId: string;

  @ApiPropertyOptional({
    enum: UpgradeTimingType,
    description: 'When to apply the upgrade',
    example: UpgradeTimingType.NEXT_PERIOD,
    default: UpgradeTimingType.NEXT_PERIOD,
  })
  @IsOptional()
  @IsEnum(UpgradeTimingType)
  timing?: UpgradeTimingType;
}
