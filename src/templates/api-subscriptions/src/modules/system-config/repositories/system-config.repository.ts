import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SystemConfig } from '../entities/system-config.entity';

@Injectable()
export class SystemConfigRepository extends Repository<SystemConfig> {
  constructor(private dataSource: DataSource) {
    super(SystemConfig, dataSource.createEntityManager());
  }

  /**
   * Get a config value by key
   */
  async getConfigByKey(key: string): Promise<SystemConfig | null> {
    return this.findOne({ where: { key } });
  }

  /**
   * Get all public configs (for frontend consumption)
   */
  async getPublicConfigs(): Promise<SystemConfig[]> {
    return this.find({ where: { isPublic: true } });
  }

  /**
   * Get all configs (for admin)
   */
  async getAllConfigs(): Promise<SystemConfig[]> {
    return this.find({ order: { key: 'ASC' } });
  }

  /**
   * Set or update a config value
   */
  async setConfig(
    key: string,
    value: string,
    type?: string,
    description?: string,
    isPublic?: boolean,
  ): Promise<SystemConfig> {
    let config = await this.getConfigByKey(key);

    if (config) {
      // Update existing config
      config.value = value;
      if (type !== undefined) config.type = type;
      if (description !== undefined) config.description = description;
      if (isPublic !== undefined) config.isPublic = isPublic;
    } else {
      // Create new config
      config = this.create({
        key,
        value,
        type: type || 'string',
        description,
        isPublic: isPublic ?? false,
      });
    }

    return this.save(config);
  }

  /**
   * Bulk update configs
   */
  async bulkUpdateConfigs(configs: Array<{ key: string; value: string }>): Promise<void> {
    for (const { key, value } of configs) {
      await this.setConfig(key, value);
    }
  }

  /**
   * Get config value as typed value (parses based on type field)
   */
  async getTypedValue(
    key: string,
  ): Promise<string | number | boolean | Record<string, unknown> | null> {
    const config = await this.getConfigByKey(key);
    if (!config) return null;

    switch (config.type) {
      case 'number':
        return parseFloat(config.value);
      case 'boolean':
        return config.value === 'true';
      case 'json':
        return JSON.parse(config.value);
      default:
        return config.value;
    }
  }
}
