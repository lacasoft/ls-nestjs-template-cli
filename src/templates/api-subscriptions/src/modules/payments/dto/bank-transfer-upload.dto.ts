import { IsUUID, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BankTransferUploadDto {
  @ApiProperty({
    description: 'Subscription ID for the payment',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  subscriptionId: string;

  @ApiPropertyOptional({
    description: 'Plan ID (optional, defaults to current subscription plan)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Reference number from the bank transfer',
    example: 'REF123456789',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments about the transfer',
    example: 'Transferred from account ending in 1234',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { transferDate: '2025-01-13', bankName: 'Bank of Example' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
