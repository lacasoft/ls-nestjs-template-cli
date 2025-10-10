import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import { APP_GUARD } from '@nestjs/core';

// Configuraciones
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import securityConfig from './config/security.config';
import cacheConfig from './common/cache/cache.config';
import { loggerConfig } from './config/logger.config';

// Middlewares
import { ApiKeyMiddleware } from './common/middleware/api-key.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CompressionMiddleware } from './common/middleware/compression.middleware';

// Guards
import { RateLimitGuard } from './common/guards/rate-limit.guard';

// Módulos
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MetricsModule } from './common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, securityConfig, cacheConfig],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database')!,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('cache'),
      inject: [ConfigService],
    }),
    WinstonModule.forRoot(loggerConfig),
    HealthModule,
    UsersModule,
    AuthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
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
        { path: 'health', method: RequestMethod.ALL },
        { path: 'users', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'metrics', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
