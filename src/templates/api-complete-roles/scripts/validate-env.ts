#!/usr/bin/env ts-node

/**
 * Environment Variables Validation Script
 * Validates .env file before build/deployment
 *
 * Usage:
 *   npm run validate:env
 *   ts-node scripts/validate-env.ts
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { validateEnv, validateProductionEnv } from '../src/config/env.validation';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message: string) {
  const border = '='.repeat(80);
  log(`\n${border}`, colors.cyan);
  log(`  ${message}`, colors.bright + colors.cyan);
  log(`${border}\n`, colors.cyan);
}

function logSuccess(message: string) {
  log(`[OK] ${message}`, colors.green);
}

function logError(message: string) {
  log(`[ERROR] ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`[WARN] ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`[INFO] ${message}`, colors.blue);
}

/**
 * Load and validate environment variables
 */
function validateEnvironment(): boolean {
  const envPath = path.resolve(process.cwd(), '.env');

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    logError(`.env file not found at: ${envPath}`);
    logInfo('Create a .env file by copying .env.example:');
    logInfo('  cp .env.example .env');
    return false;
  }

  logSuccess(`.env file found at: ${envPath}`);

  // Load .env file
  const envConfig = dotenv.config({ path: envPath });

  if (envConfig.error) {
    logError(`Failed to load .env file: ${envConfig.error.message}`);
    return false;
  }

  logSuccess('Environment variables loaded successfully');

  // Validate environment variables
  try {
    logInfo('\nValidating environment variables schema...');
    const validatedConfig = validateEnv(process.env as Record<string, unknown>);
    logSuccess('Environment variables schema validation passed');

    // Show environment summary
    logHeader('Environment Configuration Summary');
    log(`  Environment:           ${validatedConfig.NODE_ENV}`, colors.cyan);
    log(`  App Name:              ${validatedConfig.APP_NAME}`, colors.cyan);
    log(`  Port:                  ${validatedConfig.PORT}`, colors.cyan);
    log(`  Database:              ${validatedConfig.DB_TYPE}`, colors.cyan);
    log(`  Database Host:         ${validatedConfig.DB_HOST}:${validatedConfig.DB_PORT}`, colors.cyan);
    log(`  Database Name:         ${validatedConfig.DB_NAME}`, colors.cyan);
    log(`  Database SSL:          ${validatedConfig.DB_SSL || false}`, colors.cyan);
    log(`  Redis Host:            ${validatedConfig.REDIS_HOST}:${validatedConfig.REDIS_PORT}`, colors.cyan);
    log(`  JWT Expires In:        ${validatedConfig.JWT_EXPIRES_IN || '15m'}`, colors.cyan);
    log(`  JWT Refresh Expires:   ${validatedConfig.JWT_REFRESH_EXPIRES_IN || '7d'}`, colors.cyan);
    log(`  Bcrypt Salt Rounds:    ${validatedConfig.BCRYPT_SALT_ROUNDS || 12}`, colors.cyan);
    log(`  Cache TTL:             ${validatedConfig.CACHE_TTL || 300}s`, colors.cyan);

    // Production-specific validation
    if (validatedConfig.NODE_ENV === 'production') {
      logInfo('\nRunning production-specific validation...');
      validateProductionEnv(validatedConfig);
      logSuccess('Production environment validation passed');

      // Security warnings
      logHeader('Production Security Checklist');
      logSuccess('JWT secrets are properly configured');
      logSuccess('API keys are properly configured');
      logSuccess('Super admin credentials are configured');
      logSuccess('Database credentials are configured');

      if (validatedConfig.DB_SSL === 'false') {
        logWarning('Database SSL is disabled (not recommended for production)');
      } else {
        logSuccess('Database SSL is enabled');
      }

      const bcryptRounds = validatedConfig.BCRYPT_SALT_ROUNDS || 12;
      if (bcryptRounds < 12) {
        logWarning('Bcrypt salt rounds should be at least 12 for production');
      } else {
        logSuccess(`Bcrypt salt rounds: ${bcryptRounds}`);
      }
    }

    // Additional recommendations
    logHeader('Recommendations');

    if (validatedConfig.NODE_ENV === 'development') {
      logInfo('Development mode detected');
      logInfo('  - Make sure to use strong secrets before deploying to production');
      logInfo('  - Test with production-like settings before deployment');
    }

    if (!validatedConfig.API_KEY) {
      logWarning('API_KEY is not set (optional but recommended)');
      logInfo('  Generate with: openssl rand -hex 32');
    }

    if (!validatedConfig.API_SECRET) {
      logWarning('API_SECRET is not set (optional but recommended)');
      logInfo('  Generate with: openssl rand -hex 64');
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      logError('Environment validation failed:');
      console.error(error.message);
    } else {
      logError('Unknown error during environment validation');
    }
    return false;
  }
}

/**
 * Check for .env.example consistency
 */
function checkEnvExampleConsistency(): void {
  const envExamplePath = path.resolve(process.cwd(), '.env.example');

  if (!fs.existsSync(envExamplePath)) {
    logWarning('.env.example file not found');
    return;
  }

  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  const envExampleVars = envExampleContent
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter((key) => key.length > 0);

  const envContent = fs.readFileSync('.env', 'utf-8');
  const envVars = envContent
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter((key) => key.length > 0);

  const missingVars = envExampleVars.filter((key) => !envVars.includes(key));
  const extraVars = envVars.filter(
    (key) => !envExampleVars.includes(key) && !key.startsWith('npm_'),
  );

  if (missingVars.length > 0) {
    logWarning('Variables in .env.example but missing in .env:');
    missingVars.forEach((key) => logWarning(`  - ${key}`));
  }

  if (extraVars.length > 0) {
    logInfo('Variables in .env but not in .env.example (might be intentional):');
    extraVars.forEach((key) => logInfo(`  - ${key}`));
  }

  if (missingVars.length === 0 && extraVars.length === 0) {
    logSuccess('.env and .env.example are consistent');
  }
}

/**
 * Main execution
 */
function main() {
  logHeader('Environment Variables Validation');

  const isValid = validateEnvironment();

  if (isValid) {
    logInfo('\nChecking .env.example consistency...');
    checkEnvExampleConsistency();
  }

  logHeader('Validation Summary');

  if (isValid) {
    logSuccess('All environment variables are valid!');
    logSuccess('Your application is ready to start.');
    process.exit(0);
  } else {
    logError('Environment validation failed!');
    logError('Please fix the errors above before starting the application.');
    process.exit(1);
  }
}

// Run validation
main();
