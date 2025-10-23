import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Notification[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.repository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Notification | null> {
    return this.repository.findOne({ where: { id } });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const notification = await this.findOne(id);
    if (!notification) return null;

    notification.read = true;
    notification.readAt = new Date();
    return this.repository.save(notification);
  }

  async countUnread(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId, read: false },
    });
  }

  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.repository.create(notificationData);
    return this.repository.save(notification);
  }

  async markEmailSent(id: string): Promise<void> {
    await this.repository.update(id, {
      emailSent: true,
      emailSentAt: new Date(),
    });
  }
}
