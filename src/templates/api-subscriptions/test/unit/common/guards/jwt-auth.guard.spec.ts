import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;

    beforeEach(() => {
      mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should allow access if route is marked as public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Mock super.canActivate
      const superCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: ['admin'],
      };

      const result = guard.handleRequest(null, mockUser);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when no user is provided', () => {
      expect(() => {
        guard.handleRequest(null, false);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, false);
      }).toThrow('Invalid token');
    });

    it('should throw the provided error when error occurs', () => {
      const error = new Error('Token expired');

      expect(() => {
        guard.handleRequest(error, false);
      }).toThrow(error);
    });

    it('should throw the original error when error is provided', () => {
      const customError = new UnauthorizedException('Custom error message');

      expect(() => {
        guard.handleRequest(customError, false);
      }).toThrow(customError);
    });
  });
});
