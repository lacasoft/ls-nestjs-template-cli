import * as Joi from 'joi';

export interface EnvironmentVariables {
  // App
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  APP_NAME: string;
  APP_URL: string;
  FRONTEND_URL: string;

  // Database
  DB_TYPE: 'postgres' | 'mysql' | 'mariadb';
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // SMTP Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM_EMAIL: string;
  SMTP_FROM_NAME: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;

  // PayPal
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_MODE: 'sandbox' | 'production';
  PAYPAL_WEBHOOK_ID?: string;

  // Bank Transfer
  BANK_NAME: string;
  BANK_ACCOUNT_NUMBER: string;
  BANK_ACCOUNT_HOLDER: string;
  BANK_ACCOUNT_TYPE?: string;
  BANK_ROUTING_NUMBER?: string;
  BANK_SWIFT_CODE?: string;

  // WhatsApp (optional)
  WHATSAPP_NUMBER?: string;
  WHATSAPP_MESSAGE?: string;

  // Admin
  ADMIN_EMAIL: string;

  // Default User Settings
  DEFAULT_TIMEZONE: string;
  DEFAULT_CURRENCY: string;
  DEFAULT_LANGUAGE: string;

  // Cron Jobs
  CRON_PROCESS_RENEWALS?: string;
  CRON_RETRY_FAILED_PAYMENTS?: string;
  CRON_SEND_PAYMENT_REMINDERS?: string;

  // API Security
  API_KEY_HEADER?: string;
}

export const validationSchema = Joi.object<EnvironmentVariables>({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().required(),
  APP_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),

  // Database
  DB_TYPE: Joi.string().valid('postgres', 'mysql', 'mariadb').default('postgres'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters long for security',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters long for security',
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // SMTP Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM_EMAIL: Joi.string().email().required(),
  SMTP_FROM_NAME: Joi.string().required(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required().messages({
    'any.required': 'STRIPE_SECRET_KEY is required for payment processing',
  }),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required(),

  // PayPal
  PAYPAL_CLIENT_ID: Joi.string().required(),
  PAYPAL_CLIENT_SECRET: Joi.string().required(),
  PAYPAL_MODE: Joi.string().valid('sandbox', 'production').default('sandbox'),
  PAYPAL_WEBHOOK_ID: Joi.string().optional().allow(''),

  // Bank Transfer
  BANK_NAME: Joi.string().required(),
  BANK_ACCOUNT_NUMBER: Joi.string().required(),
  BANK_ACCOUNT_HOLDER: Joi.string().required(),
  BANK_ACCOUNT_TYPE: Joi.string().optional().allow(''),
  BANK_ROUTING_NUMBER: Joi.string().optional().allow(''),
  BANK_SWIFT_CODE: Joi.string().optional().allow(''),

  // WhatsApp
  WHATSAPP_NUMBER: Joi.string().optional().allow(''),
  WHATSAPP_MESSAGE: Joi.string().optional().allow(''),

  // Admin
  ADMIN_EMAIL: Joi.string().email().required(),

  // Default User Settings
  DEFAULT_TIMEZONE: Joi.string().default('America/Mexico_City'),
  DEFAULT_CURRENCY: Joi.string().length(3).uppercase().default('MXN'),
  DEFAULT_LANGUAGE: Joi.string().length(2).lowercase().default('es'),

  // Cron Jobs (optional, with defaults)
  CRON_PROCESS_RENEWALS: Joi.string().default('0 1 * * *'), // Daily at 1 AM
  CRON_RETRY_FAILED_PAYMENTS: Joi.string().default('0 */6 * * *'), // Every 6 hours
  CRON_SEND_PAYMENT_REMINDERS: Joi.string().default('0 9 * * *'), // Daily at 9 AM

  // API Security
  API_KEY_HEADER: Joi.string().default('x-api-key'),
});

/**
 * Validate environment variables
 * This function is called by NestJS ConfigModule
 */
export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const { error, value } = validationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true, // Allow other env vars
  });

  if (error) {
    const missingVars = error.details.map((detail) => {
      return `  - ${detail.path.join('.')}: ${detail.message}`;
    });

    throw new Error(
      `\n❌ Environment validation failed:\n\n${missingVars.join('\n')}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n` +
        `See .env.example for reference.\n`,
    );
  }

  return value;
}
