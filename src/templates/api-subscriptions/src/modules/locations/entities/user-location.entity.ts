import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from './location.entity';
import { Exclude } from 'class-transformer';

export enum LocationRoleType {
  ADMIN_ROOT = 'admin_root', // Puede gestionar todas las ubicaciones
  ADMIN_LOCAL = 'admin_local', // Solo puede gestionar su ubicación asignada
  SUPERVISOR = 'supervisor', // Puede supervisar operaciones en su ubicación
  OBSERVER = 'observer', // Solo lectura en su ubicación
}

@Entity('user_locations')
@Index(['userId', 'locationId'], { unique: true }) // Un usuario solo puede tener un rol por ubicación
export class UserLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Exclude()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Location, { eager: false })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Exclude()
  @Column({ name: 'location_id' })
  locationId: string;

  @Column({
    type: 'enum',
    enum: LocationRoleType,
    default: LocationRoleType.OBSERVER,
  })
  role: LocationRoleType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
