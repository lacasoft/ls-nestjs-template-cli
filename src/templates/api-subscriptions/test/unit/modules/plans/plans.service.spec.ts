import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlansService } from '../../../../src/modules/plans/plans.service';
import { PlanRepository } from '../../../../src/modules/plans/repositories/plan.repository';
import { Plan, PlanStatus, PlanInterval } from '../../../../src/modules/plans/entities/plan.entity';

describe('PlansService', () => {
  let service: PlansService;
  let repository: PlanRepository;

  const mockPlan: Plan = {
    id: '1',
    name: 'Basic Plan',
    code: 'PLAN_BASIC',
    description: 'Basic plan description',
    price: 9.99,
    currency: 'USD',
    prices: { USD: 9.99, EUR: 9.2, MXN: 175 },
    interval: PlanInterval.MONTHLY,
    intervalCount: 1,
    trialDays: 14,
    maxUsers: 5,
    maxLocations: 3,
    features: ['feature1', 'feature2'],
    status: PlanStatus.ACTIVE,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlanRepository = {
    findActivePlans: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: PlanRepository,
          useValue: mockPlanRepository,
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    repository = module.get<PlanRepository>(PlanRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of active plans', async () => {
      const plans = [mockPlan];
      mockPlanRepository.findActivePlans.mockResolvedValue(plans);

      const result = await service.findAll();

      expect(result).toEqual(plans);
      expect(repository.findActivePlans).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no plans exist', async () => {
      mockPlanRepository.findActivePlans.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(repository.findActivePlans).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a plan by id', async () => {
      mockPlanRepository.findOne.mockResolvedValue(mockPlan);

      const result = await service.findOne('1');

      expect(result).toEqual(mockPlan);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow('Plan with ID 999 not found');
    });
  });

  describe('findByCode', () => {
    it('should return a plan by code', async () => {
      mockPlanRepository.findByCode.mockResolvedValue(mockPlan);

      const result = await service.findByCode('PLAN_BASIC');

      expect(result).toEqual(mockPlan);
      expect(repository.findByCode).toHaveBeenCalledWith('PLAN_BASIC');
    });

    it('should throw NotFoundException when plan code not found', async () => {
      mockPlanRepository.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('INVALID_CODE')).rejects.toThrow(NotFoundException);
      await expect(service.findByCode('INVALID_CODE')).rejects.toThrow(
        'Plan with code INVALID_CODE not found',
      );
    });
  });
});
