/**
 * Cache TTL Constants
 * Values in milliseconds obtained from environment variables
 */

// Default TTL from .env (in milliseconds)
export const DEFAULT_CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10) * 1000; // 5 minutes

// Specific TTLs by data type
export const CACHE_TTL = {
  // Short TTL for frequently changing data (1 minute)
  SHORT: 60 * 1000, // 60,000ms = 1 minute

  // Medium TTL for standard data (5 minutes - default)
  MEDIUM: DEFAULT_CACHE_TTL, // 300,000ms = 5 minutes

  // Long TTL for rarely changing data (1 hour)
  LONG: 60 * 60 * 1000, // 3,600,000ms = 1 hour

  // Extra long TTL for static data (24 hours)
  EXTRA_LONG: 24 * 60 * 60 * 1000, // 86,400,000ms = 24 hours
} as const;

/**
 * Cache Keys Prefixes
 * Prefixes to identify cache keys by module
 */
export const CACHE_KEYS = {
  USERS: 'users',
  AUTH: 'auth',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  HEALTH: 'health',
} as const;

/**
 * Generates a cache key with module prefix
 * @param module Module prefix (e.g., 'users', 'roles')
 * @param key Specific key (e.g., 'all', 'active', 'id:123')
 * @returns Complete key (e.g., 'users:all', 'roles:admin')
 */
export function generateCacheKey(module: string, key: string): string {
  return `${module}:${key}`;
}
