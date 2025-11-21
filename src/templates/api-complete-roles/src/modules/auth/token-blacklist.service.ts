import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { AuthCacheKeys } from './constants/cache-keys.constants';

/**
 * TokenBlacklistService
 *
 * Manages blacklist of invalidated tokens (logout).
 * Uses Redis to store tokens with automatic TTL.
 */
@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
  ) {}

  /**
   * Adds a token to the blacklist
   * TTL is automatically calculated based on token expiration
   */
  async addToBlacklist(token: string): Promise<void> {
    try {
      // Decode token to get expiration
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token structure');
      }

      // Calculate TTL in milliseconds until expiration
      const expirationTime = decoded.exp * 1000; // exp is in seconds
      const currentTime = Date.now();
      const ttl = expirationTime - currentTime;

      // Only add to blacklist if token hasn't expired
      if (ttl > 0) {
        const key = AuthCacheKeys.TOKEN_BLACKLIST(token);
        await this.cacheManager.set(key, 'revoked', ttl);
      }
    } catch (error) {
      // If decode fails, add with default TTL of 7 days
      const key = AuthCacheKeys.TOKEN_BLACKLIST(token);
      await this.cacheManager.set(key, 'revoked', 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Checks if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = AuthCacheKeys.TOKEN_BLACKLIST(token);
    const value = await this.cacheManager.get(key);
    return value !== null && value !== undefined;
  }

  /**
   * Removes a token from the blacklist (rarely used)
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = AuthCacheKeys.TOKEN_BLACKLIST(token);
    await this.cacheManager.del(key);
  }
}
