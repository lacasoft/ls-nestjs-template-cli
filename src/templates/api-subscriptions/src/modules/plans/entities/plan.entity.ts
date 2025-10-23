import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'USD' })
  currency: string; // Default currency for the price

  @Column({ type: 'jsonb', nullable: true })
  prices: Record<string, number>; // Prices in different currencies: { USD: 10, EUR: 9.2, MXN: 175 }

  @Column({ type: 'enum', enum: PlanInterval, default: PlanInterval.MONTHLY })
  interval: PlanInterval;

  @Column({ type: 'int', default: 1 })
  intervalCount: number;

  @Column({ type: 'int', nullable: true })
  trialDays: number;

  @Column({ type: 'int', nullable: true })
  maxUsers: number;

  @Column({ type: 'int', nullable: true })
  maxLocations: number;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.ACTIVE })
  status: PlanStatus;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
