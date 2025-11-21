import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CACHE_KEYS } from './cache.constants';

/**
 * CacheService - Centralized cache management service with Redis
 *
 * Provides methods for:
 * - Invalidate cache by pattern (e.g., 'users:*', 'roles:*')
 * - Invalidate cache by specific key
 * - Invalidate all cache
 * - Get keys matching a pattern
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Invalidates all cache keys matching a pattern
   * @param pattern - Redis pattern (e.g., 'users:*', 'roles:123:*')
   * @example
   * await cacheService.invalidateByPattern('users:*'); // Invalidates all user cache
   * await cacheService.invalidateByPattern('roles:123:*'); // Invalidates specific role cache
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      // Access Redis store directly using any type
      const store: any = (this.cacheManager as any).store;

      // Check if store has keys method (Redis store)
      if (store && typeof store.keys === 'function') {
        // Get all keys matching the pattern
        const keys: string[] = await store.keys(pattern);

        if (keys && keys.length > 0) {
          this.logger.log(`Invalidating ${keys.length} cache keys matching pattern: ${pattern}`);

          // Delete all found keys
          await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));

          this.logger.log(`Successfully invalidated ${keys.length} cache keys`);
        } else {
          this.logger.log(`No cache keys found matching pattern: ${pattern}`);
        }
      } else {
        // Fallback: if no keys method, try to reset all cache
        this.logger.warn('Redis store does not support keys() method. Attempting to clear cache.');
        if (typeof (this.cacheManager as any).reset === 'function') {
          await (this.cacheManager as any).reset();
        } else {
          this.logger.warn('Cache manager does not support reset method');
        }
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache by pattern '${pattern}':`, error);
      throw error;
    }
  }

  /**
   * Invalidates a specific cache key
   * @param key - Exact key to invalidate
   * @example
   * await cacheService.invalidateByKey('users:list:page=1&limit=10');
   */
  async invalidateByKey(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.log(`Cache key invalidated: ${key}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Invalidates multiple specific keys
   * @param keys - Array of keys to invalidate
   * @example
   * await cacheService.invalidateByKeys(['users:123', 'users:456']);
   */
  async invalidateByKeys(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
      this.logger.log(`${keys.length} cache keys invalidated`);
    } catch (error) {
      this.logger.error('Error invalidating multiple cache keys:', error);
      throw error;
    }
  }

  /**
   * Invalidates ALL Redis cache
   * Use with caution - this deletes all cached keys
   */
  async invalidateAll(): Promise<void> {
    try {
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
        this.logger.warn('All cache has been invalidated');
      } else {
        await this.invalidateByPattern('*');
        this.logger.warn('All cache has been invalidated using wildcard pattern');
      }
    } catch (error) {
      this.logger.error('Error invalidating all cache:', error);
      throw error;
    }
  }

  /**
   * Invalidates all cache related to a specific module
   * @param module - Module to invalidate cache for (users, roles, etc.)
   * @example
   * await cacheService.invalidateModule('users'); // Invalidates 'users:*'
   * await cacheService.invalidateModule('roles'); // Invalidates 'roles:*'
   */
  async invalidateModule(module: keyof typeof CACHE_KEYS): Promise<void> {
    const pattern = `${CACHE_KEYS[module.toUpperCase() as keyof typeof CACHE_KEYS]}:*`;
    await this.invalidateByPattern(pattern);
  }

  /**
   * Gets all keys matching a pattern (useful for debugging)
   * @param pattern - Redis pattern
   * @returns Array of found keys
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      const store: any = (this.cacheManager as any).store;

      if (store && typeof store.keys === 'function') {
        const keys: string[] = await store.keys(pattern);
        this.logger.log(`Found ${keys.length} keys matching pattern: ${pattern}`);
        return keys;
      } else {
        this.logger.warn('Redis store does not support keys() method');
        return [];
      }
    } catch (error) {
      this.logger.error(`Error getting keys by pattern '${pattern}':`, error);
      return [];
    }
  }

  /**
   * Gets a value from cache
   * @param key - Key to get
   * @returns Cached value or undefined if not exists
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting cache key '${key}':`, error);
      return undefined;
    }
  }

  /**
   * Sets a value in cache with optional TTL
   * @param key - Key to set
   * @param value - Value to store
   * @param ttl - TTL in milliseconds (optional, uses default if not specified)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl !== undefined) {
        await this.cacheManager.set(key, value, ttl);
      } else {
        await this.cacheManager.set(key, value);
      }
      this.logger.log(`Cache key set: ${key}${ttl ? ` (TTL: ${ttl}ms)` : ''}`);
    } catch (error) {
      this.logger.error(`Error setting cache key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Checks if a key exists in cache
   * @param key - Key to check
   * @returns true if key exists, false otherwise
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined && value !== null;
    } catch (error) {
      this.logger.error(`Error checking cache key '${key}':`, error);
      return false;
    }
  }

  /**
   * Gets cache statistics (if store supports it)
   * @returns Object with cache statistics
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const store: any = (this.cacheManager as any).store;

      if (store && typeof store.keys === 'function') {
        const allKeys: string[] = await store.keys('*');
        return {
          totalKeys: allKeys.length,
          keysByModule: {
            users: (await store.keys('users:*')).length,
            auth: (await store.keys('auth:*')).length,
            roles: (await store.keys('roles:*')).length,
            permissions: (await store.keys('permissions:*')).length,
          },
        };
      } else {
        return { message: 'Stats not available - store does not support keys() method' };
      }
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { error: 'Failed to get cache stats' };
    }
  }
}
