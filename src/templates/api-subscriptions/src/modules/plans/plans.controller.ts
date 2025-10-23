import { Controller, Get, Param } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll(): Promise<Plan[]> {
    return this.plansService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Plan> {
    return this.plansService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<Plan> {
    return this.plansService.findByCode(code);
  }
}
