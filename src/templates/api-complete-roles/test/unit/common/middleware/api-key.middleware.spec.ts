import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeyMiddleware } from '../../../../src/common/middleware/api-key.middleware';

describe('ApiKeyMiddleware', () => {
  let middleware: ApiKeyMiddleware;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyMiddleware,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    middleware = module.get<ApiKeyMiddleware>(ApiKeyMiddleware);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'app.apiKey': 'valid-api-key',
        'app.apiSecret': 'valid-api-secret',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should call next() when API key and secret are valid', () => {
      mockRequest.headers = {
        'x-api-key': 'valid-api-key',
        'x-api-secret': 'valid-api-secret',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API key is missing', () => {
      mockRequest.headers = {
        'x-api-secret': 'valid-api-secret',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow('Invalid API credentials');

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API secret is missing', () => {
      mockRequest.headers = {
        'x-api-key': 'valid-api-key',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      mockRequest.headers = {
        'x-api-key': 'invalid-api-key',
        'x-api-secret': 'valid-api-secret',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API secret is invalid', () => {
      mockRequest.headers = {
        'x-api-key': 'valid-api-key',
        'x-api-secret': 'invalid-api-secret',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when both key and secret are invalid', () => {
      mockRequest.headers = {
        'x-api-key': 'wrong-key',
        'x-api-secret': 'wrong-secret',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when headers are completely missing', () => {
      mockRequest.headers = {};

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive header names', () => {
      // Express normalizes headers to lowercase
      mockRequest.headers = {
        'X-API-Key': 'valid-api-key',
        'X-API-Secret': 'valid-api-secret',
      };

      // This will fail because Express converts to lowercase
      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(UnauthorizedException);
    });

    it('should verify config service is called for credentials', () => {
      mockRequest.headers = {
        'x-api-key': 'valid-api-key',
        'x-api-secret': 'valid-api-secret',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(configService.get).toHaveBeenCalledWith('app.apiKey');
      expect(configService.get).toHaveBeenCalledWith('app.apiSecret');
    });
  });
});
