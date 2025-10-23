import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Location } from '../entities/location.entity';

@Injectable()
export class LocationRepository extends Repository<Location> {
  constructor(private dataSource: DataSource) {
    super(Location, dataSource.createEntityManager());
  }

  async findByAccountId(accountId: string): Promise<Location[]> {
    return this.find({
      where: { account: { id: accountId } },
      order: { createdAt: 'DESC' },
    });
  }

  async softDeleteLocation(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async countByAccountId(accountId: string): Promise<number> {
    return this.count({
      where: { account: { id: accountId } },
    });
  }
}
