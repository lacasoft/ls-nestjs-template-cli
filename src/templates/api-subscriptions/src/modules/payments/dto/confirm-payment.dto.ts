import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Stripe Payment Intent ID',
    example: 'pi_3MKJj1L8w8qKhW2j0QqZ5v8g',
  })
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({
    description: 'Stripe Payment Method ID (optional, if not attached to intent)',
    example: 'pm_1MKJj1L8w8qKhW2j0QqZ5v8g',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
