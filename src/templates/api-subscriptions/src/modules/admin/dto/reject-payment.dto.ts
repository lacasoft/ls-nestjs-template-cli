import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPaymentDto {
  @ApiProperty({
    description: 'Reason for rejecting the payment',
    example: 'Invalid payment proof or insufficient information',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
