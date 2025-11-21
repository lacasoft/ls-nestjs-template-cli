import { applyDecorators } from '@nestjs/common';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Password validation requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 * - At least 1 special character (@$!%*?&#)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/;

const PASSWORD_ERROR_MESSAGE =
  'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character (@$!%*?&#)';

export interface PasswordValidationOptions {
  description?: string;
  example?: string;
  minLength?: number;
  required?: boolean;
}

/**
 * Unified password validation decorator
 * Combines all password validation rules in a single decorator
 *
 * @param options - Configuration options
 * @returns Combined decorators for password validation
 *
 * @example
 * ```typescript
 * export class ChangePasswordDto {
 *   @ValidatePassword()
 *   newPassword: string;
 * }
 * ```
 */
export function ValidatePassword(options: PasswordValidationOptions = {}) {
  const {
    description = 'User password',
    example = 'SecurePass123!',
    minLength = 8,
    required = true,
  } = options;

  const decorators = [
    ApiProperty({
      description,
      example,
      minLength,
      format: 'password',
      pattern: PASSWORD_REGEX.source,
    }),
    IsString({ message: 'Password must be a string' }),
    MinLength(minLength, {
      message: `Password must be at least ${minLength} characters`,
    }),
    Matches(PASSWORD_REGEX, {
      message: PASSWORD_ERROR_MESSAGE,
    }),
  ];

  if (required) {
    decorators.push(IsNotEmpty({ message: 'Password is required' }));
  }

  return applyDecorators(...decorators);
}
