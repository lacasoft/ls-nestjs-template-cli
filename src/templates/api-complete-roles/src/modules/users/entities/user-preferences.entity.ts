import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum Language {
  EN = 'en',
  ES = 'es',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum Currency {
  CLP = 'CLP', // Peso Chileno
  USD = 'USD', // Dólar
  EUR = 'EUR', // Euro
  MXN = 'MXN', // Peso Mexicano
  ARS = 'ARS', // Peso Argentino
}

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.ES,
  })
  language: Language;

  @Column({
    type: 'enum',
    enum: Theme,
    default: Theme.AUTO,
  })
  theme: Theme;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.MXN,
  })
  currency: Currency;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone?: string;

  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  smsNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  marketingEmails: boolean;

  @Column({ type: 'boolean', default: true })
  eventReminders: boolean;

  @OneToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
