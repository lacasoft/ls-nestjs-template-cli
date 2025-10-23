import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckFeatureDto {
  @ApiProperty({
    description: 'Feature code to check',
    example: 'advanced_analytics',
  })
  @IsString()
  @IsNotEmpty()
  featureCode: string;
}
