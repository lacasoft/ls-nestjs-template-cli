import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Account } from '../../accounts/entities/account.entity';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('invitation_tokens')
export class InvitationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Exclude()
  @RelationId((invitation: InvitationToken) => invitation.account)
  accountId: string;

  @Column()
  email: string;

  @Column({ unique: true })
  token: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Exclude()
  @RelationId((invitation: InvitationToken) => invitation.role)
  roleId: string;

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy: User;

  @Exclude()
  @RelationId((invitation: InvitationToken) => invitation.invitedBy)
  invitedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'accepted_by_user_id' })
  acceptedBy: User;

  @Exclude()
  @RelationId((invitation: InvitationToken) => invitation.acceptedBy)
  acceptedByUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
