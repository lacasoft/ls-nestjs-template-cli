import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CapturePayPalOrderDto {
  @ApiProperty({
    description: 'PayPal Order ID to capture',
    example: '5O190127TN364715T',
  })
  @IsString()
  orderId: string;
}
