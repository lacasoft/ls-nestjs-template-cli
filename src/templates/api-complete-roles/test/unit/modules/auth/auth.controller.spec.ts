import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { LoginDto } from '../../../../src/modules/auth/dto/login.dto';
import { RefreshTokenDto } from '../../../../src/modules/auth/dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockTokenResponse = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockTokenResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should return access token and refresh token', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
    });

    it('should include user data in response', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.login(loginDto);

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
    });

    it('should propagate errors from service', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };

      const mockRequest = {
        user: {
          sub: '1',
          email: 'test@example.com',
        },
      };

      const refreshedTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(refreshedTokens);

      const result = await controller.refresh(refreshTokenDto, mockRequest);

      expect(result).toEqual(refreshedTokens);
      expect(service.refreshTokens).toHaveBeenCalledWith('1', 'test@example.com');
      expect(service.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should extract user data from request', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };

      const mockRequest = {
        user: {
          sub: 'user-123',
          email: 'user@example.com',
        },
      };

      const refreshedTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(refreshedTokens);

      await controller.refresh(refreshTokenDto, mockRequest);

      expect(service.refreshTokens).toHaveBeenCalledWith('user-123', 'user@example.com');
    });

    it('should propagate errors from service on invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'invalid-refresh-token',
      };

      const mockRequest = {
        user: {
          sub: '1',
          email: 'test@example.com',
        },
      };

      const error = new Error('Invalid refresh token');
      mockAuthService.refreshTokens.mockRejectedValue(error);

      await expect(controller.refresh(refreshTokenDto, mockRequest)).rejects.toThrow(error);
    });
  });
});
