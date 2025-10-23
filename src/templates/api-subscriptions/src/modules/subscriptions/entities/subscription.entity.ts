import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Plan } from '../../plans/entities/plan.entity';

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  status: SubscriptionStatus;

  @Column({ name: 'trialStartsAt', type: 'timestamp', nullable: true })
  trialStartsAt: Date;

  @Column({ name: 'trialEndsAt', type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'startsAt', type: 'timestamp', nullable: true })
  startsAt: Date;

  @Column({ name: 'endsAt', type: 'timestamp', nullable: true })
  endsAt: Date;

  @Column({ name: 'nextBillingDate', type: 'timestamp', nullable: true })
  nextBillingDate: Date;

  @Column({ name: 'canceledAt', type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ name: 'cancelReason', type: 'text', nullable: true })
  cancelReason: string;

  @Column({ name: 'currentPrice', type: 'decimal', precision: 10, scale: 2 })
  currentPrice: number;

  @Column({ name: 'autoRenew', default: true })
  autoRenew: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
