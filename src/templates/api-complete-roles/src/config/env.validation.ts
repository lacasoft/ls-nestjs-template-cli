import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsEmail,
  IsUrl,
  IsIn,
  IsOptional,
  Min,
  Max,
  MinLength,
  validateSync,
  ValidationError,
} from 'class-validator';

/**
 * Environment Variables Validation Schema
 * Ensures all required environment variables are present and valid
 */
class EnvironmentVariables {
  // ==========================================================================
  // APP CONFIGURATION
  // ==========================================================================

  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @IsString()
  @MinLength(1)
  APP_NAME: string = 'ls-template';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // ==========================================================================
  // API KEYS - SECURITY CRITICAL
  // ==========================================================================

  @IsString()
  @MinLength(32, {
    message: 'API_KEY must be at least 32 characters. Generate with: openssl rand -hex 32',
  })
  @IsOptional()
  API_KEY?: string;

  @IsString()
  @MinLength(64, {
    message: 'API_SECRET must be at least 64 characters. Generate with: openssl rand -hex 64',
  })
  @IsOptional()
  API_SECRET?: string;

  // ==========================================================================
  // JWT SECRETS - SECURITY CRITICAL
  // ==========================================================================

  @IsString()
  @MinLength(32, {
    message:
      "JWT_SECRET must be at least 32 characters. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  })
  JWT_SECRET: string;

  @IsString()
  @MinLength(32, {
    message:
      "JWT_REFRESH_SECRET must be at least 32 characters. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  })
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string = '7d';

  // ==========================================================================
  // DATABASE CONFIGURATION
  // ==========================================================================

  @IsIn(['postgres', 'mysql', 'mariadb', 'sqlite', 'mssql', 'oracle', 'cockroachdb'])
  DB_TYPE: 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql' | 'oracle' | 'cockroachdb' =
    'postgres';

  @IsString()
  DB_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  @IsString()
  @MinLength(1)
  DB_USERNAME: string;

  @IsString()
  @MinLength(1)
  DB_PASSWORD: string;

  @IsString()
  @MinLength(1)
  DB_NAME: string;

  @IsString()
  DB_SSL: string = 'false';

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  DB_POOL_SIZE?: number = 10;

  @IsInt()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  DB_IDLE_TIMEOUT?: number = 30000;

  @IsInt()
  @Min(1000)
  @Max(60000)
  @IsOptional()
  DB_CONNECTION_TIMEOUT?: number = 10000;

  // ==========================================================================
  // SECURITY CONFIGURATION
  // ==========================================================================

  @IsString()
  ALLOWED_ORIGINS: string = 'http://localhost:3000,http://localhost:3001';

  @IsInt()
  @Min(12, {
    message:
      'BCRYPT_SALT_ROUNDS must be at least 12 for modern security (2025+). Recommended: 12-14',
  })
  @Max(14, {
    message: 'BCRYPT_SALT_ROUNDS should not exceed 14 to avoid performance issues',
  })
  @IsOptional()
  BCRYPT_SALT_ROUNDS?: number = 12;

  @IsInt()
  @Min(15552000) // 6 months minimum
  @Max(63072000) // 2 years maximum
  @IsOptional()
  HSTS_MAX_AGE?: number = 31536000;

  // ==========================================================================
  // REDIS CONFIGURATION
  // ==========================================================================

  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string = '';

  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB?: number = 0;

  // ==========================================================================
  // CACHE CONFIGURATION
  // ==========================================================================

  @IsInt()
  @Min(1)
  @Max(3600)
  @IsOptional()
  CACHE_TTL?: number = 300;

  @IsInt()
  @Min(1)
  @Max(300)
  @IsOptional()
  CACHE_TTL_SHORT?: number = 60;

  @IsInt()
  @Min(300)
  @Max(7200)
  @IsOptional()
  CACHE_TTL_LONG?: number = 3600;

  @IsInt()
  @Min(3600)
  @Max(172800)
  @IsOptional()
  CACHE_TTL_EXTRA_LONG?: number = 86400;

  @IsInt()
  @Min(100)
  @Max(10000)
  @IsOptional()
  CACHE_MAX_ITEMS?: number = 1000;

  @IsInt()
  @Min(10000) // 10 seconds
  @Max(3600000) // 1 hour
  @IsOptional()
  PERMISSIONS_CACHE_TTL?: number = 300000;

  @IsString()
  @IsOptional()
  CLUSTER_WORKERS?: string = 'auto';

  // ==========================================================================
  // RATE LIMITING
  // ==========================================================================

  @IsInt()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  THROTTLE_TTL?: number = 60000;

  @IsInt()
  @Min(10)
  @Max(1000)
  @IsOptional()
  THROTTLE_LIMIT?: number = 100;

  @IsInt()
  @Min(3)
  @Max(20)
  @IsOptional()
  THROTTLE_LOGIN_LIMIT?: number = 5;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  THROTTLE_FORGOT_PASSWORD_LIMIT?: number = 3;

  @IsInt()
  @Min(5)
  @Max(50)
  @IsOptional()
  THROTTLE_REGISTER_LIMIT?: number = 10;

  // ==========================================================================
  // SUPER ADMIN (FOR SEEDER)
  // ==========================================================================

  @IsEmail({}, { message: 'SUPER_ADMIN_EMAIL must be a valid email address' })
  SUPER_ADMIN_EMAIL: string;

  @IsString()
  @MinLength(8, {
    message: 'SUPER_ADMIN_PASSWORD must be at least 8 characters (strong password recommended)',
  })
  SUPER_ADMIN_PASSWORD: string;

  @IsString()
  @MinLength(1)
  SUPER_ADMIN_FIRST_NAME: string;

  @IsString()
  @MinLength(1)
  SUPER_ADMIN_LAST_NAME: string;

  // ==========================================================================
  // SWAGGER CONFIGURATION
  // ==========================================================================

  @IsString()
  @IsOptional()
  SWAGGER_TITLE?: string = 'API';

  @IsString()
  @IsOptional()
  SWAGGER_DESCRIPTION?: string = 'API Documentation';

  @IsString()
  @IsOptional()
  SWAGGER_VERSION?: string = '1.0.0';

  // ==========================================================================
  // EMAIL CONFIGURATION (SMTP) - OPTIONAL
  // ==========================================================================

  @IsString()
  @IsOptional()
  EMAIL_SMTP_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  EMAIL_SMTP_PORT?: number = 587;

  @IsOptional()
  EMAIL_SMTP_SECURE?: boolean = false;

  @IsEmail()
  @IsOptional()
  EMAIL_SMTP_USER?: string;

  @IsString()
  @IsOptional()
  EMAIL_SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM_NAME?: string = 'App';

  @IsEmail()
  @IsOptional()
  EMAIL_FROM_ADDRESS?: string;

  @IsString()
  @IsOptional()
  EMAIL_APP_NAME?: string = 'App';

  @IsEmail()
  @IsOptional()
  EMAIL_SUPPORT_EMAIL?: string;

  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'FRONTEND_URL must be a valid URL with protocol (e.g., http://localhost:3001)' },
  )
  @IsOptional()
  FRONTEND_URL?: string;
}

/**
 * Validates environment variables and throws an error if validation fails
 * @param config - Raw environment variables from process.env
 * @returns Validated and transformed environment variables
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  // Transform string values to appropriate types
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // Convert strings to numbers/booleans
  });

  // Validate the transformed config
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false, // Allow extra env vars
  });

  if (errors.length > 0) {
    // Format errors for better readability
    const formattedErrors = formatValidationErrors(errors);

    throw new Error(
      `\n\n${'='.repeat(80)}\n` +
        `Environment Variables Validation Failed\n` +
        `${'='.repeat(80)}\n\n` +
        `The following environment variables are missing or invalid:\n\n` +
        `${formattedErrors}\n\n` +
        `${'='.repeat(80)}\n` +
        `Please check your .env file and fix the errors above.\n` +
        `See .env.example for reference.\n` +
        `${'='.repeat(80)}\n`,
    );
  }

  return validatedConfig;
}

/**
 * Formats validation errors for console output
 */
function formatValidationErrors(errors: ValidationError[]): string {
  const formatError = (error: ValidationError, depth = 0): string => {
    const indent = '  '.repeat(depth);
    let message = `${indent}* ${error.property}:\n`;

    if (error.constraints) {
      Object.values(error.constraints).forEach((constraint) => {
        message += `${indent}   -> ${constraint}\n`;
      });
    }

    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => {
        message += formatError(child, depth + 1);
      });
    }

    return message;
  };

  return errors.map((error) => formatError(error)).join('\n');
}

/**
 * Production-specific validation
 * Enforces stricter rules for production environments
 */
export function validateProductionEnv(config: EnvironmentVariables): void {
  const errors: string[] = [];

  // Require API keys in production
  if (!config.API_KEY || config.API_KEY.length < 32) {
    errors.push('API_KEY is required in production and must be at least 32 characters');
  }

  if (!config.API_SECRET || config.API_SECRET.length < 64) {
    errors.push('API_SECRET is required in production and must be at least 64 characters');
  }

  // Ensure no default/dev secrets are used
  if (config.JWT_SECRET.includes('dev-secret') || config.JWT_SECRET.includes('CHANGE')) {
    errors.push('JWT_SECRET cannot contain dev/example values in production');
  }

  if (
    config.JWT_REFRESH_SECRET.includes('dev-refresh') ||
    config.JWT_REFRESH_SECRET.includes('CHANGE')
  ) {
    errors.push('JWT_REFRESH_SECRET cannot contain dev/example values in production');
  }

  // Verify database password is not weak
  if (
    config.DB_PASSWORD.includes('password') ||
    config.DB_PASSWORD.includes('your-password') ||
    config.DB_PASSWORD.length < 8
  ) {
    errors.push('DB_PASSWORD appears to be weak or a placeholder in production');
  }

  // Check SSL is enabled for database in production
  if (config.DB_SSL === 'false' && config.DB_TYPE === 'postgres') {
    console.warn('WARNING: DB_SSL is disabled in production. This is not recommended.');
  }

  // Verify HSTS is properly configured
  if (config.HSTS_MAX_AGE && config.HSTS_MAX_AGE < 15552000) {
    errors.push('HSTS_MAX_AGE should be at least 6 months (15552000 seconds) in production');
  }

  // Ensure super admin password is not weak/example
  if (
    config.SUPER_ADMIN_PASSWORD.includes('<') ||
    config.SUPER_ADMIN_PASSWORD.includes('>') ||
    config.SUPER_ADMIN_PASSWORD.includes('GENERATE') ||
    config.SUPER_ADMIN_PASSWORD.length < 12
  ) {
    errors.push(
      'SUPER_ADMIN_PASSWORD must be a strong password (min 12 chars) in production, not a placeholder',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `\n\n${'='.repeat(80)}\n` +
        `Production Environment Validation Failed\n` +
        `${'='.repeat(80)}\n\n` +
        `The following issues must be fixed before deploying to production:\n\n` +
        `${errors.map((err, i) => `${i + 1}. ${err}`).join('\n')}\n\n` +
        `${'='.repeat(80)}\n` +
        `Production requires all secrets to be properly generated and configured.\n` +
        `${'='.repeat(80)}\n`,
    );
  }
}
