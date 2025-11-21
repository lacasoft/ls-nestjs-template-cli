import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language, Theme, Currency } from '../entities/user-preferences.entity';

export class UpdatePreferencesDto {
  @ApiProperty({ example: Language.ES, required: false, enum: Language })
  @IsOptional()
  @IsEnum(Language, { message: 'language must be one of the following values: en, es' })
  language?: Language;

  @ApiProperty({ example: Theme.DARK, required: false, enum: Theme })
  @IsOptional()
  @IsEnum(Theme, { message: 'theme must be one of the following values: light, dark, auto' })
  theme?: Theme;

  @ApiProperty({ example: Currency.MXN, required: false, enum: Currency })
  @IsOptional()
  @IsEnum(Currency, {
    message: 'currency must be one of the following values: CLP, USD, EUR, MXN, ARS',
  })
  currency?: Currency;

  @ApiProperty({ example: 'America/Mexico_City', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  eventReminders?: boolean;
}
