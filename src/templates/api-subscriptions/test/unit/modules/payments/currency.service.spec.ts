import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../../../../src/modules/payments/services/currency.service';
import { CurrencyRepository } from '../../../../src/modules/payments/repositories/currency.repository';
import { NotFoundException } from '@nestjs/common';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let repository: jest.Mocked<CurrencyRepository>;

  const mockCurrencies = [
    {
      id: '1',
      code: 'MXN',
      name: 'Mexican Peso',
      symbol: '$',
      exchangeRateToUSD: 17.5,
      isActive: true,
      isDefault: true,
    },
    {
      id: '2',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      exchangeRateToUSD: 1.0,
      isActive: true,
      isDefault: false,
    },
    {
      id: '3',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      exchangeRateToUSD: 0.92,
      isActive: true,
      isDefault: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: CurrencyRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findByCode: jest.fn(),
            findActiveCurrencies: jest.fn(),
            findDefaultCurrency: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    repository = module.get(CurrencyRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveCurrencies', () => {
    it('should return all active currencies', async () => {
      repository.findActiveCurrencies.mockResolvedValue(mockCurrencies as any);

      const result = await service.getActiveCurrencies();

      expect(result).toHaveLength(3);
      expect(repository.findActiveCurrencies).toHaveBeenCalled();
    });
  });

  describe('getDefaultCurrency', () => {
    it('should return the default currency', async () => {
      repository.findDefaultCurrency.mockResolvedValue(mockCurrencies[0] as any);

      const result = await service.getDefaultCurrency();

      expect(result.code).toBe('MXN');
      expect(result.isDefault).toBe(true);
      expect(repository.findDefaultCurrency).toHaveBeenCalled();
    });

    it('should fallback to USD if no default currency', async () => {
      repository.findDefaultCurrency.mockResolvedValue(null);
      repository.findByCode.mockResolvedValue(mockCurrencies[1] as any);

      const result = await service.getDefaultCurrency();

      expect(result.code).toBe('USD');
      expect(repository.findByCode).toHaveBeenCalledWith('USD');
    });
  });

  describe('getCurrencyByCode', () => {
    it('should return currency by code', async () => {
      repository.findByCode.mockResolvedValue(mockCurrencies[1] as any);

      const result = await service.getCurrencyByCode('USD');

      expect(result.code).toBe('USD');
      expect(repository.findByCode).toHaveBeenCalledWith('USD');
    });

    it('should throw NotFoundException for invalid code', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.getCurrencyByCode('XXX')).rejects.toThrow(NotFoundException);
    });
  });

  describe('convertAmount', () => {
    it('should convert amount between currencies', async () => {
      repository.findByCode
        .mockResolvedValueOnce(mockCurrencies[0] as any) // MXN
        .mockResolvedValueOnce(mockCurrencies[1] as any); // USD

      const result = await service.convertAmount(175, 'MXN', 'USD');

      expect(result).toBeCloseTo(10, 2);
    });

    it('should return same amount for same currency', async () => {
      const result = await service.convertAmount(100, 'MXN', 'MXN');

      expect(result).toBe(100);
    });

    it('should convert MXN to EUR', async () => {
      repository.findByCode
        .mockResolvedValueOnce(mockCurrencies[0] as any) // MXN
        .mockResolvedValueOnce(mockCurrencies[2] as any); // EUR

      const result = await service.convertAmount(175, 'MXN', 'EUR');

      expect(result).toBeCloseTo(9.2, 1);
    });
  });

  describe('getExchangeRate', () => {
    it('should calculate exchange rate between currencies', async () => {
      repository.findByCode
        .mockResolvedValueOnce(mockCurrencies[0] as any) // MXN
        .mockResolvedValueOnce(mockCurrencies[1] as any); // USD

      const result = await service.getExchangeRate('MXN', 'USD');

      expect(result).toBeCloseTo(0.0571, 4);
    });

    it('should return 1 for same currency', async () => {
      const result = await service.getExchangeRate('USD', 'USD');

      expect(result).toBe(1);
    });
  });
});
