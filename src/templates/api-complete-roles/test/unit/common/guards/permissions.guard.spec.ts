import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from '../../../../src/common/guards/permissions.guard';
import { PERMISSIONS_KEY } from '../../../../src/common/decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
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
            user: null,
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should return true if no permissions are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should return false if user is not present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read']);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: null,
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false if user has no permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read']);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: '1', email: 'test@example.com' },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true if user has all required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read', 'users:create']);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            permissions: ['users:read', 'users:create', 'users:update'],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false if user is missing one required permission', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['users:read', 'users:create', 'users:delete']);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            permissions: ['users:read', 'users:create'], // Missing users:delete
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true if user has single required permission', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read']);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            permissions: ['users:read'],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false if user has different permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:delete']);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            permissions: ['users:read', 'users:create'],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true for empty required permissions array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            permissions: [],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
