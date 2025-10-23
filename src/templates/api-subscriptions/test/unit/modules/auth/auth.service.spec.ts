import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { UsersService } from '../../../../src/modules/users/users.service';
import { EmailService } from '../../../../src/common/services/email.service';
import { PasswordUtil } from '../../../../src/common/utils/password.util';
import { RoleType } from '../../../../src/modules/roles/entities/role.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        getRepository: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();

    // Default config mock
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'app.jwtSecret': 'test-secret',
        'app.jwtExpiresIn': '15m',
        'app.jwtRefreshSecret': 'test-refresh-secret',
        'app.jwtRefreshExpiresIn': '7d',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);

      const result = await service.validateUser(loginDto);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe(loginDto.email);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should return null when user not found', async () => {
      const loginDto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(loginDto);

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(false);

      const result = await service.validateUser(loginDto);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token, refresh token and user data', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserWithRoles = {
        ...mockUser,
        roles: [
          {
            id: 'role1',
            name: RoleType.ADMIN,
            permissions: [
              { id: 'perm1', name: 'users:read' },
              { id: 'perm2', name: 'users:create' },
            ],
          },
        ],
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findOne.mockResolvedValue(mockUserWithRoles);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      // Check if it's not an MFA response
      if ('user' in result) {
        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('refresh_token');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toBe(loginDto.email);
        expect(result.user.roles).toBeDefined();
        expect(result.access_token).toBe('access-token');
        expect(result.refresh_token).toBe('refresh-token');
      }
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should include roles and permissions in JWT payload', async () => {
      const loginDto = {
        email: 'admin@example.com',
        password: 'admin123',
      };

      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        password: 'hashedPassword',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserWithRoles = {
        ...mockUser,
        roles: [
          {
            id: 'role1',
            name: RoleType.SUPER_ADMIN,
            permissions: [
              { id: 'perm1', name: 'users:read' },
              { id: 'perm2', name: 'users:create' },
              { id: 'perm3', name: 'users:delete' },
            ],
          },
        ],
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findOne.mockResolvedValue(mockUserWithRoles);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login(loginDto);

      // Verify that signAsync was called with correct payload
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          email: loginDto.email,
          sub: mockUser.id,
          roles: [RoleType.SUPER_ADMIN],
          permissions: expect.arrayContaining(['users:read', 'users:create', 'users:delete']),
        }),
        expect.any(Object),
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when user is valid', async () => {
      const userId = '1';
      const email = 'test@example.com';

      const mockUser = {
        id: userId,
        email: email,
        firstName: 'Test',
        lastName: 'User',
        roles: [
          {
            id: 'role1',
            name: RoleType.ADMIN,
            permissions: [{ id: 'perm1', name: 'users:read' }],
          },
        ],
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshTokens(userId, email);

      expect(result).toHaveProperty('access_token', 'new-access-token');
      expect(result).toHaveProperty('refresh_token', 'new-refresh-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const userId = 'non-existent';
      const email = 'test@example.com';

      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens(userId, email)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshTokens(userId, email)).rejects.toThrow('User not found');
    });
  });

  describe('getTokens (private method - tested through login)', () => {
    it('should generate tokens with correct configuration', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockUserWithRoles = {
        ...mockUser,
        roles: [],
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findOne.mockResolvedValue(mockUserWithRoles);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login(loginDto);

      // Verify JWT configuration was used
      expect(mockConfigService.get).toHaveBeenCalledWith('app.jwtSecret');
      expect(mockConfigService.get).toHaveBeenCalledWith('app.jwtExpiresIn');
      expect(mockConfigService.get).toHaveBeenCalledWith('app.jwtRefreshSecret');
      expect(mockConfigService.get).toHaveBeenCalledWith('app.jwtRefreshExpiresIn');

      // Verify signAsync was called with correct options
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          secret: 'test-secret',
          expiresIn: '15m',
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        }),
      );
    });

    it('should handle user with no roles', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '2',
        email: 'user@example.com',
        password: 'hashedPassword',
        firstName: 'Regular',
        lastName: 'User',
      };

      const mockUserWithoutRoles = {
        ...mockUser,
        roles: null,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findOne.mockResolvedValue(mockUserWithoutRoles);
      jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [],
          permissions: [],
        }),
        expect.any(Object),
      );
    });
  });
});
