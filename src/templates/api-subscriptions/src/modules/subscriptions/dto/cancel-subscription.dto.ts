import { IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description:
      'UUID of the subscription to cancel (optional, will use current user subscription if not provided)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({
    description: 'Whether to cancel at the end of the current period (true) or immediately (false)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'No longer needed',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional feedback about the cancellation',
    example: 'El servicio fue excelente, pero ahora necesitamos una solución diferente.',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
