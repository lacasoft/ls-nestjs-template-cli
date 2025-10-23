import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Transaction ID to refund',
    example: 'uuid-here',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Amount to refund (optional, defaults to full refund)',
    example: 50.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Customer requested refund',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Additional notes for internal use',
    example: 'Approved by manager',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
