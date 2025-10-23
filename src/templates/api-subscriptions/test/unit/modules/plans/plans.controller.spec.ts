import { Test, TestingModule } from '@nestjs/testing';
import { PlansController } from '../../../../src/modules/plans/plans.controller';
import { PlansService } from '../../../../src/modules/plans/plans.service';
import { Plan, PlanStatus, PlanInterval } from '../../../../src/modules/plans/entities/plan.entity';

describe('PlansController', () => {
  let controller: PlansController;
  let service: PlansService;

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

  const mockPlansService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [
        {
          provide: PlansService,
          useValue: mockPlansService,
        },
      ],
    }).compile();

    controller = module.get<PlansController>(PlansController);
    service = module.get<PlansService>(PlansService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of plans', async () => {
      const plans = [mockPlan];
      mockPlansService.findAll.mockResolvedValue(plans);

      const result = await controller.findAll();

      expect(result).toEqual(plans);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single plan', async () => {
      mockPlansService.findOne.mockResolvedValue(mockPlan);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockPlan);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByCode', () => {
    it('should return a plan by code', async () => {
      mockPlansService.findByCode.mockResolvedValue(mockPlan);

      const result = await controller.findByCode('PLAN_BASIC');

      expect(result).toEqual(mockPlan);
      expect(service.findByCode).toHaveBeenCalledWith('PLAN_BASIC');
    });
  });
});
