import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 3 })
  code: string; // USD, EUR, MXN, etc.

  @Column()
  name: string; // US Dollar, Euro, Mexican Peso

  @Column()
  symbol: string; // $, €, $

  @Column({ name: 'exchange_rate_to_usd', type: 'decimal', precision: 10, scale: 6, default: 1.0 })
  exchangeRateToUSD: number; // Exchange rate relative to USD

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean; // One currency should be marked as default

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
