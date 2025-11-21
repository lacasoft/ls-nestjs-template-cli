import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * CacheModule - Global module for cache management
 *
 * This module is global, meaning CacheService will be available
 * throughout the application without needing to import the module everywhere.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheCustomModule {}
