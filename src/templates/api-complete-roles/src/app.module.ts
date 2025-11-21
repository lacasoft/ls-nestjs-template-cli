import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Configurations
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import securityConfig from './config/security.config';
import cacheConfig from './common/cache/cache.config';
import { loggerConfig } from './config/logger.config';
import emailConfig from './config/email.config';
import { validateEnv, validateProductionEnv } from './config/env.validation';

// Middlewares
import { ApiKeyMiddleware } from './common/middleware/api-key.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CompressionMiddleware } from './common/middleware/compression.middleware';

// Guards
import { RateLimitGuard } from './common/guards/rate-limit.guard';

// Interceptors
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

// Modules
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { EmailModule } from './common/email/email.module';
import { CacheCustomModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, securityConfig, cacheConfig, emailConfig],
      cache: true,
      validate: (config) => {
        const validatedConfig = validateEnv(config);

        // Additional production-specific validation
        if (process.env.NODE_ENV === 'production') {
          validateProductionEnv(validatedConfig);
        }

        return validatedConfig;
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database')!,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => [
        {
          ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
        },
      ],
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('cache'),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB') || 0,
        },
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRoot(loggerConfig),
    HealthModule,
    UsersModule,
    AuthModule,
    RolesModule,
    MetricsModule,
    EmailModule,
    CacheCustomModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware, CompressionMiddleware)
      .forRoutes('*')
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: '', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'metrics', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
