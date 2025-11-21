/**
 * Cache key constants for Auth module
 * Using module prefix to avoid key collisions
 */
export const AuthCacheKeys = {
  PREFIX: 'auth',
  TOKEN_BLACKLIST: (token: string) => `auth:blacklist:${token}`,
  PASSWORD_RESET: (userId: string) => `auth:password-reset:${userId}`,
  PASSWORD_RESET_RATE_LIMIT: (email: string) => `auth:password-reset-rate:${email}`,
  REFRESH_TOKEN: (userId: string) => `auth:refresh:${userId}`,
} as const;
