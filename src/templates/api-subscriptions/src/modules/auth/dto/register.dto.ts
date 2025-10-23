import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../../accounts/entities/account.entity';

export class RegisterDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @ApiProperty({
    description:
      'Contraseña del usuario (mínimo 8 caracteres, debe contener mayúscula, minúscula, número y carácter especial)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Contraseña es requerida' })
  @MinLength(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'Contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Tipo de cuenta',
    enum: AccountType,
    example: AccountType.INDIVIDUAL,
    required: false,
    default: AccountType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(AccountType, { message: 'Account type must be either individual or tenant' })
  accountType?: AccountType;
}
