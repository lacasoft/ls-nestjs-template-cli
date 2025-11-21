/**
 * Throttle Constants
 *
 * Defines rate limiting for different endpoints
 * Values configurable through environment variables
 */

// Base values from environment variables
export const THROTTLE_TTL = parseInt(process.env.THROTTLE_TTL || '60000', 10); // 60 seconds
export const THROTTLE_LIMIT = parseInt(process.env.THROTTLE_LIMIT || '100', 10); // 100 requests

// Specific limits by endpoint type
export const THROTTLE_LOGIN_LIMIT = parseInt(process.env.THROTTLE_LOGIN_LIMIT || '5', 10);
export const THROTTLE_FORGOT_PASSWORD_LIMIT = parseInt(
  process.env.THROTTLE_FORGOT_PASSWORD_LIMIT || '3',
  10,
);
export const THROTTLE_REGISTER_LIMIT = parseInt(process.env.THROTTLE_REGISTER_LIMIT || '10', 10);

/**
 * Throttle configuration for Login
 * Protects against brute force attacks
 */
export const LOGIN_THROTTLE_CONFIG = {
  default: {
    limit: THROTTLE_LOGIN_LIMIT, // 5 requests per minute
    ttl: THROTTLE_TTL,
  },
};

/**
 * Throttle configuration for Forgot Password
 * Prevents account enumeration
 */
export const FORGOT_PASSWORD_THROTTLE_CONFIG = {
  default: {
    limit: THROTTLE_FORGOT_PASSWORD_LIMIT, // 3 requests per minute
    ttl: THROTTLE_TTL,
  },
};

/**
 * Throttle configuration for Registration
 * Prevents account creation spam
 */
export const REGISTER_THROTTLE_CONFIG = {
  default: {
    limit: THROTTLE_REGISTER_LIMIT, // 10 requests per minute
    ttl: THROTTLE_TTL,
  },
};

/**
 * Default global configuration
 */
export const DEFAULT_THROTTLE_CONFIG = {
  default: {
    limit: THROTTLE_LIMIT,
    ttl: THROTTLE_TTL,
  },
};
