import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { PasswordUtil } from '../../common/utils/password.util';
import { UserWithoutPassword } from '../../shared/interfaces/user.interface';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
        roles: user.roles,
      },
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
}
