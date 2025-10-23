import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Plan, PlanStatus } from '../entities/plan.entity';

@Injectable()
export class PlanRepository extends Repository<Plan> {
  constructor(private dataSource: DataSource) {
    super(Plan, dataSource.createEntityManager());
  }

  async findActivePlans(): Promise<Plan[]> {
    return this.find({
      where: { status: PlanStatus.ACTIVE },
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Plan | null> {
    return this.findOne({ where: { code } });
  }
}
