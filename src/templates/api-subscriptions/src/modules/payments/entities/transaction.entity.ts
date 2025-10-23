import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { Account } from '../../accounts/entities/account.entity';

export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  REFUND = 'refund',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'MXN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.SUBSCRIPTION_PAYMENT,
  })
  transactionType: TransactionType;

  // Stripe specific fields
  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', nullable: true })
  stripeCheckoutSessionId: string;

  @Column({ type: 'varchar', nullable: true })
  stripeChargeId: string;

  @Column({ type: 'varchar', nullable: true })
  stripeCustomerId: string;

  // PayPal specific fields
  @Column({ type: 'varchar', nullable: true })
  paypalOrderId: string;

  @Column({ type: 'varchar', nullable: true })
  paypalCaptureId: string;

  // Bank transfer specific fields
  @Column({ type: 'text', nullable: true })
  bankTransferReference: string;

  @Column({ type: 'varchar', nullable: true })
  bankTransferProofUrl: string;

  @Column({ type: 'varchar', nullable: true })
  receiptFileName: string;

  @Column({ type: 'varchar', nullable: true })
  receiptMimeType: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string; // User ID of admin who approved

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  // General metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
