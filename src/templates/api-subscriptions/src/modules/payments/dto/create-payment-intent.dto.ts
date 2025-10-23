import { IsUUID, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../entities/transaction.entity';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Subscription ID to pay for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  subscriptionId: string;

  @ApiPropertyOptional({
    description: 'Plan ID for new subscription or upgrade',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: 'Type of transaction',
    example: TransactionType.SUBSCRIPTION_PAYMENT,
    default: TransactionType.SUBSCRIPTION_PAYMENT,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description: 'Additional metadata for the payment',
    example: { source: 'web', campaign: 'summer_sale' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
