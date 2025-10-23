import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreferences } from '../entities/notification-preferences.entity';

@Injectable()
export class NotificationPreferencesRepository {
  constructor(
    @InjectRepository(NotificationPreferences)
    private readonly repository: Repository<NotificationPreferences>,
  ) {}

  async findByUserId(userId: string): Promise<NotificationPreferences | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async create(userId: string): Promise<NotificationPreferences> {
    const preferences = this.repository.create({ userId });
    return this.repository.save(preferences);
  }

  async update(
    userId: string,
    data: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    await this.repository.update({ userId }, data);
    const preferences = await this.findByUserId(userId);
    if (!preferences) {
      throw new Error('Preferences not found after update');
    }
    return preferences;
  }

  async findOrCreate(userId: string): Promise<NotificationPreferences> {
    let preferences = await this.findByUserId(userId);
    if (!preferences) {
      preferences = await this.create(userId);
    }
    return preferences;
  }
}
