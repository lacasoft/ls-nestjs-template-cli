import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PasswordUtil } from '../../common/utils/password.util';
import { UserWithoutPassword } from '../../shared/interfaces/user.interface';
import { Role } from '../roles/entities/role.entity';
import { EmailService } from '../../common/email/email.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { AuthCacheKeys } from './constants/cache-keys.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private tokenBlacklistService: TokenBlacklistService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (user && (await PasswordUtil.comparePassword(loginDto.password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }

    // Security logging: Failed login attempt
    if (user) {
      this.logger.warn(`Failed login attempt for user: ${loginDto.email} - Invalid password`);
    } else {
      this.logger.warn(`Failed login attempt for non-existent email: ${loginDto.email}`);
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // CRITICAL: Check if user account is active
    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${user.email}`);
      throw new ForbiddenException('Account is suspended. Please contact support.');
    }

    const userWithRoles = await this.usersService.findOne(user.id);
    const tokens = await this.getTokens(
      userWithRoles.id,
      userWithRoles.email,
      userWithRoles.roles || [],
    );

    // Security logging: Successful login
    this.logger.log(
      `Successful login for user: ${userWithRoles.email} (ID: ${userWithRoles.id}) with roles: ${userWithRoles.roles?.map((r) => r.name).join(', ')}`,
    );

    return {
      ...tokens,
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        firstName: userWithRoles.firstName,
        lastName: userWithRoles.lastName,
        roles: userWithRoles.roles,
      },
    };
  }

  async refreshTokens(userId: string, email: string, oldRefreshToken?: string) {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user account is active
    if (!user.isActive) {
      this.logger.warn(`Token refresh attempt for inactive user: ${user.email}`);
      throw new ForbiddenException('Account is suspended. Please contact support.');
    }

    // Refresh token rotation: Invalidate the old refresh token
    if (oldRefreshToken) {
      try {
        await this.tokenBlacklistService.addToBlacklist(oldRefreshToken);
        this.logger.log(`Old refresh token invalidated for user: ${user.email} (ID: ${user.id})`);
      } catch (error) {
        this.logger.error(`Failed to blacklist old refresh token: ${error.message}`);
      }
    }

    // Generate new token pair
    const tokens = await this.getTokens(userId, email, user.roles || []);

    // Security logging: Successful token refresh
    this.logger.log(`Token refreshed for user: ${user.email} (ID: ${user.id})`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles:
          user.roles?.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
          })) || [],
      },
    };
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto) {
    // Create user using UsersService
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      roleIds: registerDto.roleIds,
    });

    // Generate tokens for the new user
    const userWithRoles = await this.usersService.findOne(user.id);
    const tokens = await this.getTokens(
      userWithRoles.id,
      userWithRoles.email,
      userWithRoles.roles || [],
    );

    return {
      ...tokens,
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        firstName: userWithRoles.firstName,
        lastName: userWithRoles.lastName,
        roles: userWithRoles.roles,
      },
    };
  }

  /**
   * Logout - Invalidates the refresh token
   */
  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify token is valid before adding to blacklist
      const jwtRefreshSecret = this.configService.get<string>('app.jwtRefreshSecret');

      if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, { secret: jwtRefreshSecret });

      // Add to blacklist
      await this.tokenBlacklistService.addToBlacklist(refreshToken);

      // Security logging: Successful logout
      this.logger.log(`Logout successful for user: ${payload.email} (ID: ${payload.sub})`);

      return {
        success: true,
        message: 'Logout successful. Your session has been closed.',
      };
    } catch (error) {
      this.logger.warn(`Failed logout attempt - Invalid token`);
      throw new BadRequestException('Invalid token');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // For security, always return the same message
    // Don't reveal if the email exists or not
    const successMessage = 'Password reset email sent successfully';

    // Rate limiting per email to prevent abuse and account enumeration
    // Limit: 3 attempts per email per hour
    const rateLimitKey = AuthCacheKeys.PASSWORD_RESET_RATE_LIMIT(email.toLowerCase());
    const attempts = (await this.cacheManager.get<number>(rateLimitKey)) || 0;
    const maxAttempts = 3;
    const windowMs = 60 * 60 * 1000; // 1 hour

    if (attempts >= maxAttempts) {
      this.logger.warn(`Password reset rate limit exceeded for email: ${email}`);
      // Return generic message for security
      return { message: successMessage };
    }

    // Increment attempt counter
    await this.cacheManager.set(rateLimitKey, attempts + 1, windowMs);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: successMessage };
    }

    // Generate JWT reset token (valid for 1 hour)
    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'password-reset',
      },
      {
        secret: this.configService.get<string>('app.jwtSecret'),
        expiresIn: '1h',
      },
    );

    // Save token in Redis to allow revocation if needed
    const resetKey = AuthCacheKeys.PASSWORD_RESET(user.id);
    await this.cacheManager.set(resetKey, resetToken, 60 * 60 * 1000); // 1 hour

    // Send email with token
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName || '');
      // Security logging: Password reset requested
      this.logger.log(`Password reset requested for user: ${user.email} (ID: ${user.id})`);
    } catch (error) {
      // Log error but don't fail
      this.logger.error(`Error sending password reset email: ${error.message}`, error.stack);
    }

    return { message: successMessage };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    try {
      // Verify and decode JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('app.jwtSecret'),
      });

      // Validate token type is password-reset
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid token type');
      }

      const userId = payload.sub;

      // Verify token exists in Redis (not revoked)
      const resetKey = AuthCacheKeys.PASSWORD_RESET(userId);
      const storedToken = await this.cacheManager.get<string>(resetKey);

      if (!storedToken || storedToken !== token) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Update password
      const user = await this.usersService.findOne(userId);
      const hashedPassword = await PasswordUtil.hashPassword(newPassword);

      // Update password directly in database
      await this.userRepository.update(userId, { password: hashedPassword });

      // Delete reset token from Redis
      await this.cacheManager.del(resetKey);

      // Security logging: Password successfully reset
      this.logger.log(`Password successfully reset for user: ${user.email} (ID: ${user.id})`);

      // Send confirmation email
      try {
        await this.emailService.sendPasswordChangedConfirmation(user.email, user.firstName || '');
      } catch (error) {
        this.logger.error(
          `Error sending password changed confirmation: ${error.message}`,
          error.stack,
        );
      }

      return { message: 'Password reset successfully' };
    } catch (error) {
      // Security logging: Failed password reset
      this.logger.warn(`Failed password reset attempt - ${error.message}`);

      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Invalid or expired reset token');
      }
      throw error;
    }
  }

  private async getTokens(userId: string, email: string, roles: Role[] = []) {
    // Extract role names only
    // NOTE: Permissions are NOT included in JWT tokens for security and performance
    // Permissions should be fetched via GET /users/permissions/me endpoint
    const roleNames = roles.map((role) => role.name);

    const payload = {
      email: email,
      sub: userId,
      roles: roleNames,
    };

    // Get configurations - secrets are validated at startup in app.config
    const jwtSecret = this.configService.get<string>('app.jwtSecret');
    const jwtExpiresIn = this.configService.get<string>('app.jwtExpiresIn') as StringValue;
    const jwtRefreshSecret = this.configService.get<string>('app.jwtRefreshSecret');
    const jwtRefreshExpiresIn = this.configService.get<string>(
      'app.jwtRefreshExpiresIn',
    ) as StringValue;

    // Failsafe: These should never be undefined due to app.config validation
    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets not configured. Application should not start without them.');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: jwtRefreshExpiresIn,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
