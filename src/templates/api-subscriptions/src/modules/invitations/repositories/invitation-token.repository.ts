import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InvitationToken, InvitationStatus } from '../entities/invitation-token.entity';

@Injectable()
export class InvitationTokenRepository extends Repository<InvitationToken> {
  constructor(private dataSource: DataSource) {
    super(InvitationToken, dataSource.createEntityManager());
  }

  async findByToken(token: string): Promise<InvitationToken | null> {
    return this.findOne({
      where: { token },
      relations: ['account', 'role', 'invitedBy'],
    });
  }

  async findPendingByAccountId(accountId: string): Promise<InvitationToken[]> {
    return this.find({
      where: {
        account: { id: accountId },
        status: InvitationStatus.PENDING,
      },
      relations: ['role', 'invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmail(email: string): Promise<InvitationToken | null> {
    return this.findOne({
      where: { email },
      relations: ['account', 'role'],
    });
  }

  async findPendingByEmail(email: string, accountId: string): Promise<InvitationToken | null> {
    return this.findOne({
      where: {
        email,
        account: { id: accountId },
        status: InvitationStatus.PENDING,
      },
      relations: ['account', 'role'],
    });
  }

  async markAsExpired(id: string): Promise<void> {
    await this.update(id, { status: InvitationStatus.EXPIRED });
  }

  async markAsAccepted(id: string, acceptedByUserId: string): Promise<void> {
    const invitation = await this.findOne({ where: { id } });
    if (invitation) {
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedBy = { id: acceptedByUserId } as any;
      invitation.acceptedAt = new Date();
      await this.save(invitation);
    }
  }

  async markAsRevoked(id: string): Promise<void> {
    await this.update(id, { status: InvitationStatus.REVOKED });
  }

  async findExpiredInvitations(): Promise<InvitationToken[]> {
    return this.createQueryBuilder('invitation')
      .where('invitation.status = :status', { status: InvitationStatus.PENDING })
      .andWhere('invitation.expiresAt < :now', { now: new Date() })
      .andWhere('invitation.deletedAt IS NULL')
      .getMany();
  }

  async softDeleteInvitation(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async restoreInvitation(id: string): Promise<void> {
    await this.restore(id);
  }
}
