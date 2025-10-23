import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async createLog(data: {
    userId: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = this.repository.create(data);
    return this.repository.save(log);
  }

  async findLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    entity?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entity) where.entity = filters.entity;

    const [logs, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      relations: ['user'],
    });

    return { logs, total };
  }

  async findLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }
}
