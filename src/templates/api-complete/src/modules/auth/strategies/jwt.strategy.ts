import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

interface ValidatedUser {
  userId: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('app.jwtSecret') || 'default-secret',
    });
  }

  validate(payload: JwtPayload): Promise<ValidatedUser> {
    return Promise.resolve({
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    });
  }
}
