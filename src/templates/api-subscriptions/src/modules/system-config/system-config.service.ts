import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { SystemConfigRepository } from './repositories/system-config.repository';

@Injectable()
export class SystemConfigService {
  private readonly PUBLIC_CONFIG_CACHE_KEY = 'public_system_config';
  private readonly CACHE_TTL = 600000; // 10 minutos (más largo para config público)

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  /**
   * Get only public system configuration
   * (configurations with isPublic = true)
   */
  async getPublicConfig() {
    // Try to get from cache first
    const config = await this.cacheManager.get(this.PUBLIC_CONFIG_CACHE_KEY);

    if (config) {
      return config;
    }

    // Fetch only public configs from database
    const publicConfigs = await this.systemConfigRepository.getPublicConfigs();

    // Transform to object
    const configObject: Record<string, string | number | boolean | Record<string, unknown>> = {};

    for (const config of publicConfigs) {
      // Parse value based on type
      let value: string | number | boolean | Record<string, unknown> = config.value;
      if (config.type === 'number') {
        value = parseFloat(config.value);
      } else if (config.type === 'boolean') {
        value = config.value === 'true';
      } else if (config.type === 'json') {
        try {
          value = JSON.parse(config.value);
        } catch {
          value = config.value;
        }
      }

      // Convert snake_case to camelCase
      const camelKey = config.key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      configObject[camelKey] = value;
    }

    // Build features object from specific config keys
    const features: Record<string, boolean> = {};
    if (configObject.enableEmailNotifications !== undefined) {
      features.emailNotifications = configObject.enableEmailNotifications;
      delete configObject.enableEmailNotifications;
    }
    if (configObject.enablePushNotifications !== undefined) {
      features.smsNotifications = configObject.enablePushNotifications;
      delete configObject.enablePushNotifications;
    }

    // Add features if any exist
    if (Object.keys(features).length > 0) {
      configObject.features = features;
    }

    // Cache the public config
    await this.cacheManager.set(this.PUBLIC_CONFIG_CACHE_KEY, configObject, this.CACHE_TTL);

    return configObject;
  }

  /**
   * Invalidate public config cache
   * Call this when system config is updated
   */
  async invalidatePublicCache() {
    await this.cacheManager.del(this.PUBLIC_CONFIG_CACHE_KEY);
  }
}
