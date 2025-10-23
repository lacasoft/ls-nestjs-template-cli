import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_ACTIVATED = 'subscription_activated',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  TRIAL_EXPIRING = 'trial_expiring',
  TRIAL_EXPIRED = 'trial_expired',
  BANK_TRANSFER_PENDING = 'bank_transfer_pending',
  BANK_TRANSFER_APPROVED = 'bank_transfer_approved',
  BANK_TRANSFER_REJECTED = 'bank_transfer_rejected',
  INVITATION_RECEIVED = 'invitation_received',
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  USER_ADDED = 'user_added',
  ROLE_CHANGED = 'role_changed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  GENERAL = 'general',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  actionUrl: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  emailSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
