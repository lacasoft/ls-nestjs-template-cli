import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async logSystemConfigChange(
    userId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.auditLogRepository.createLog({
      userId,
      action: AuditAction.UPDATE,
      entity: 'SYSTEM_CONFIG',
      oldValues,
      newValues,
      description: 'System configuration updated',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    entity?: string;
    limit?: number;
    offset?: number;
  }) {
    const action = filters?.action as AuditAction;
    return this.auditLogRepository.findLogs({
      ...filters,
      action,
    });
  }

  async getEntityHistory(entity: string, entityId: string) {
    return this.auditLogRepository.findLogsByEntity(entity, entityId);
  }
}
