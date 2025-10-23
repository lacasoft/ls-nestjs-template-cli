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
import { validateEnvironment } from './config/env.validation';

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
import { RolesModule } from './modules/roles/roles.module';
import { PlansModule } from './modules/plans/plans.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { LocationsModule } from './modules/locations/locations.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulerModule } from './common/scheduler/scheduler.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { FeaturesModule } from './modules/features/features.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, securityConfig, cacheConfig],
      cache: true,
      validate: validateEnvironment,
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
    RolesModule,
    PlansModule,
    AccountsModule,
    SubscriptionsModule,
    InvitationsModule,
    LocationsModule,
    AdminModule,
    PaymentsModule,
    NotificationsModule,
    SchedulerModule,
    MetricsModule,
    FeaturesModule,
    SystemConfigModule,
    AuditModule,
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
        { path: '', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'metrics', method: RequestMethod.ALL },
        { path: 'payments/stripe/webhook', method: RequestMethod.POST },
        { path: 'payments/paypal/webhook', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
