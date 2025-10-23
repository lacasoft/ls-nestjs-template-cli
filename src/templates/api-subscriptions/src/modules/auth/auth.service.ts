import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import type { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyMfaLoginDto } from './dto/verify-mfa-login.dto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../common/services/email.service';
import { MfaService } from './mfa.service';
import { PasswordUtil } from '../../common/utils/password.util';
import { UserWithoutPassword } from '../../shared/interfaces/user.interface';
import { Role } from '../roles/entities/role.entity';
import { Account, AccountType } from '../accounts/entities/account.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../plans/entities/plan.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
    private emailService: EmailService,
    private mfaService: MfaService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Usar transacción para crear usuario, cuenta y suscripción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear la cuenta
      const accountRepository = queryRunner.manager.getRepository(Account);
      const account = accountRepository.create({
        name: `${registerDto.firstName} ${registerDto.lastName}'s Account`,
        slug: `${registerDto.email.split('@')[0]}-${Date.now()}`,
        description: 'Personal account',
        accountType: registerDto.accountType || AccountType.INDIVIDUAL,
        isActive: true,
        settings: {
          timezone: this.configService.get('DEFAULT_TIMEZONE', 'America/Mexico_City'),
          currency: this.configService.get('DEFAULT_CURRENCY', 'MXN'),
          language: this.configService.get('DEFAULT_LANGUAGE', 'es'),
        },
      });
      const savedAccount = await accountRepository.save(account);

      // 2. Crear el usuario y asignarlo a la cuenta
      const userRepository = queryRunner.manager.getRepository('User');
      const hashedPassword = await PasswordUtil.hashPassword(registerDto.password);
      const user = userRepository.create({
        ...registerDto,
        password: hashedPassword,
        account: savedAccount,
        isAccountOwner: true,
      });
      const savedUser = await userRepository.save(user);

      // 3. Obtener el plan FREE
      const planRepository = queryRunner.manager.getRepository(Plan);
      const freePlan = await planRepository.findOne({ where: { code: 'PLAN_FREE' } });

      if (!freePlan) {
        this.logger.error(
          'Free plan not found in database. Please run: npm run seed:subscriptions',
        );
        throw new Error('Free plan not found. Please run seeds first: npm run seed:subscriptions');
      }

      this.logger.log(`Found FREE plan with ID: ${freePlan.id}`);

      // 4. Crear suscripción con periodo de prueba
      const subscriptionRepository = queryRunner.manager.getRepository(Subscription);
      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días de trial

      const subscription = subscriptionRepository.create({
        account: savedAccount,
        plan: freePlan,
        status: SubscriptionStatus.TRIAL,
        trialStartsAt: now,
        trialEndsAt: trialEndsAt,
        nextBillingDate: trialEndsAt,
        currentPrice: freePlan.price,
        autoRenew: true,
        metadata: {
          source: 'registration',
          createdBy: 'system',
        },
      });
      const savedSubscription = await subscriptionRepository.save(subscription);

      this.logger.log(
        `Created subscription ${savedSubscription.id} for account ${savedAccount.id}`,
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Transaction committed successfully for user ${savedUser.email}`);

      // Generar tokens
      const tokens = await this.getTokens(savedUser.id, savedUser.email, []);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          accountId: savedAccount.id,
          roles: [],
        },
        account: {
          id: savedAccount.id,
          name: savedAccount.name,
          accountType: savedAccount.accountType,
        },
        subscription: {
          id: savedSubscription.id,
          status: savedSubscription.status,
          trialEndsAt: savedSubscription.trialEndsAt,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validateUser(loginDto: LoginDto): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (user && (await PasswordUtil.comparePassword(loginDto.password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userWithRoles = await this.usersService.findOne(user.id);

    // Si el usuario tiene MFA habilitado, retornar tempToken en lugar de tokens completos
    if (userWithRoles.mfaEnabled) {
      const tempToken = await this.jwtService.signAsync(
        {
          userId: userWithRoles.id,
          email: userWithRoles.email,
          type: 'mfa-temp',
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '5m', // El tempToken expira en 5 minutos
        },
      );

      return {
        requiresMfa: true,
        message: 'MFA verification required',
        tempToken,
      };
    }

    // Si no tiene MFA, retornar tokens normales
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
        roles: (userWithRoles.roles || []).map((role) => ({
          name: role.name,
          description: role.description,
          isActive: role.isActive,
        })),
      },
    };
  }

  async refreshTokens(userId: string, email: string) {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.getTokens(userId, email, user.roles || []);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: (user.roles || []).map((role) => ({
          name: role.name,
          description: role.description,
          isActive: role.isActive,
        })),
      },
    };
  }

  async logout(_userId: string) {
    // En una implementación completa, aquí podrías:
    // 1. Invalidar el refresh token en una lista negra (blacklist)
    // 2. Eliminar tokens de una tabla de sesiones
    // 3. Registrar el logout en audit logs

    // Por ahora, solo retornamos un mensaje de éxito
    // El cliente debe eliminar los tokens del almacenamiento local
    return {
      message: 'Logout successful',
      success: true,
    };
  }

  private async getTokens(userId: string, email: string, roles: Role[] = []) {
    // Extract role names and permissions
    const roleNames = roles.map((role) => role.name);
    const permissions = roles.flatMap((role) => role.permissions?.map((p) => p.name) || []);
    const uniquePermissions = [...new Set(permissions)];

    const payload = {
      email: email,
      sub: userId,
      roles: roleNames,
      permissions: uniquePermissions,
    };

    // Obtener configuraciones con valores por defecto y tipado correcto
    const jwtSecret = this.configService.get<string>('app.jwtSecret') || 'super-secret-key';
    const jwtExpiresIn = (this.configService.get<string>('app.jwtExpiresIn') ||
      '1d') as StringValue;
    const jwtRefreshSecret =
      this.configService.get<string>('app.jwtRefreshSecret') || 'super-refresh-secret-key';
    const jwtRefreshExpiresIn = (this.configService.get<string>('app.jwtRefreshExpiresIn') ||
      '7d') as StringValue;

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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token (JWT with 1 hour expiration)
    const resetToken = await this.jwtService.signAsync(
      { userId: user.id, email: user.email, type: 'password-reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      `${user.firstName} ${user.lastName}`,
    );

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      // Verify and decode token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if it's a password reset token
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Find user
      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await PasswordUtil.hashPassword(newPassword);

      // Update user password
      await this.usersService.updatePassword(user.id, hashedPassword);

      return {
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Reset token has expired. Please request a new password reset.',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset token');
      }
      throw error;
    }
  }

  /**
   * Verify MFA token during login and return access tokens
   */
  async verifyMfaLogin(verifyMfaLoginDto: VerifyMfaLoginDto) {
    const { tempToken, token } = verifyMfaLoginDto;

    try {
      // Verify and decode tempToken
      const payload = await this.jwtService.verifyAsync(tempToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if it's a mfa-temp token
      if (payload.type !== 'mfa-temp') {
        throw new BadRequestException('Invalid token type');
      }

      // Find user
      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify user has MFA enabled and secret
      if (!user.mfaEnabled || !user.mfaSecret) {
        throw new BadRequestException('MFA not enabled for this user');
      }

      // Verify the MFA token
      const isValidMfaToken = this.mfaService.verifyToken(token, user.mfaSecret);
      if (!isValidMfaToken) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      // Generate full access tokens
      const tokens = await this.getTokens(user.id, user.email, user.roles || []);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: (user.roles || []).map((role) => ({
            name: role.name,
            description: role.description,
            isActive: role.isActive,
          })),
        },
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Temporary token has expired. Please login again.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid temporary token');
      }
      throw error;
    }
  }

  /**
   * Validate password against hashed password
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return PasswordUtil.comparePassword(plainPassword, hashedPassword);
  }
}
