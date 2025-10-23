import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserLocation } from '../entities/user-location.entity';

@Injectable()
export class UserLocationRepository extends Repository<UserLocation> {
  constructor(private dataSource: DataSource) {
    super(UserLocation, dataSource.createEntityManager());
  }

  async findByLocationId(locationId: string): Promise<UserLocation[]> {
    return this.find({
      where: { locationId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<UserLocation[]> {
    return this.find({
      where: { userId },
      relations: ['location'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserAndLocation(userId: string, locationId: string): Promise<UserLocation | null> {
    return this.findOne({
      where: { userId, locationId },
      relations: ['user', 'location'],
    });
  }

  async removeUserFromLocation(userId: string, locationId: string): Promise<void> {
    await this.delete({ userId, locationId });
  }

  async countUsersByLocationId(locationId: string): Promise<number> {
    return this.count({ where: { locationId } });
  }

  async isUserInLocation(userId: string, locationId: string): Promise<boolean> {
    const count = await this.count({ where: { userId, locationId } });
    return count > 0;
  }
}
