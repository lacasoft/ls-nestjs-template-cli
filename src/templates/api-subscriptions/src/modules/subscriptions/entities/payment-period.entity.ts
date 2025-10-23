import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Subscription } from './subscription.entity';

export enum PaymentPeriodStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payment_periods')
export class PaymentPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Exclude()
  @RelationId((period: PaymentPeriod) => period.subscription)
  subscriptionId: string;

  @Column({ type: 'timestamp' })
  periodStartsAt: Date;

  @Column({ type: 'timestamp' })
  periodEndsAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentPeriodStatus, default: PaymentPeriodStatus.PENDING })
  status: PaymentPeriodStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
