import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationChannel } from './notification.entity';

@Entity('notification_preferences')
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  // Payment notifications
  @Column({ type: 'boolean', default: true })
  paymentSuccess: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  paymentSuccessChannels: NotificationChannel[];

  @Column({ type: 'boolean', default: true })
  paymentFailed: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  paymentFailedChannels: NotificationChannel[];

  // Subscription notifications
  @Column({ type: 'boolean', default: true })
  subscriptionExpiring: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  subscriptionExpiringChannels: NotificationChannel[];

  @Column({ type: 'boolean', default: true })
  subscriptionExpired: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  subscriptionExpiredChannels: NotificationChannel[];

  // Trial notifications
  @Column({ type: 'boolean', default: true })
  trialExpiring: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  trialExpiringChannels: NotificationChannel[];

  // Bank transfer notifications
  @Column({ type: 'boolean', default: true })
  bankTransferStatus: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  bankTransferStatusChannels: NotificationChannel[];

  // Invitation notifications
  @Column({ type: 'boolean', default: true })
  invitations: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  invitationsChannels: NotificationChannel[];

  // System announcements
  @Column({ type: 'boolean', default: true })
  systemAnnouncements: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  systemAnnouncementsChannels: NotificationChannel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
