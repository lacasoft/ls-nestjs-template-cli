import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DowngradeSubscriptionDto {
  @ApiPropertyOptional({
    description:
      'UUID of the subscription to downgrade (optional, will use current user subscription if not provided)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({
    description: 'UUID of the new plan (must be lower tier)',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  newPlanId: string;

  @ApiPropertyOptional({
    description: 'Reason for downgrading the subscription',
    example: 'Reducción de equipo',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
