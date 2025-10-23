import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanRepository } from './repositories/plan.repository';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(private planRepository: PlanRepository) {}

  async findAll(): Promise<Plan[]> {
    return this.planRepository.findActivePlans();
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async findByCode(code: string): Promise<Plan> {
    const plan = await this.planRepository.findByCode(code);

    if (!plan) {
      throw new NotFoundException(`Plan with code ${code} not found`);
    }

    return plan;
  }
}
