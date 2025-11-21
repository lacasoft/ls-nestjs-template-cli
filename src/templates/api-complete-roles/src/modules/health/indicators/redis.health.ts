import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test Redis connection by setting and getting a test key
      const testKey = 'health-check-test';
      const testValue = Date.now().toString();

      await this.cacheManager.set(testKey, testValue, 1000); // 1 second TTL
      const result = await this.cacheManager.get(testKey);

      if (result === testValue) {
        await this.cacheManager.del(testKey);
        return this.getStatus(key, true, {
          message: 'Redis cache is operational',
        });
      }

      throw new Error('Redis read/write test failed');
    } catch (error) {
      const result = this.getStatus(key, false, {
        message: error.message || 'Redis connection failed',
      });
      throw new HealthCheckError('Redis check failed', result);
    }
  }
}
