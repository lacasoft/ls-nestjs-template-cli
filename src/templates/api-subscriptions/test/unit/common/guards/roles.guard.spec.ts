import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../../../../src/common/guards/roles.guard';
import { RoleType } from '../../../../src/modules/roles/entities/role.entity';
import { ROLES_KEY } from '../../../../src/common/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
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

    it('should return true if no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should return false if user is not present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.ADMIN]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: null,
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false if user has no roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.ADMIN]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: '1', email: 'test@example.com' },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true if user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.ADMIN]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            roles: [RoleType.ADMIN],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true if user has one of the required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RoleType.ADMIN, RoleType.SUPER_ADMIN]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            roles: [RoleType.SUPER_ADMIN],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false if user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.SUPER_ADMIN]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            roles: [RoleType.OBSERVER],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true if user has multiple roles including required one', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.ADMIN]);

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '1',
            email: 'test@example.com',
            roles: [RoleType.OBSERVER, RoleType.ADMIN, RoleType.SUPERVISOR],
          },
        }),
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
