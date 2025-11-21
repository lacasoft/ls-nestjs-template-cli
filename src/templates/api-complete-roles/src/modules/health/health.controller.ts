import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { EmailHealthIndicator } from './indicators/email.health';

/**
 * Comprehensive Health Check Controller
 *
 * Provides detailed health status for all critical services:
 * - PostgreSQL database (connection test)
 * - Redis cache (connection and operations test)
 * - Email/SMTP (connection verification)
 * - Memory usage (heap and RSS)
 * - Disk storage (available space)
 *
 * Returns HTTP 200 if all checks pass, HTTP 503 if any check fails.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
    private email: EmailHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive system health check' })
  @ApiResponse({
    status: 200,
    description: 'All services are healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          smtp: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          disk: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          smtp: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          disk: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'One or more services are unhealthy',
    schema: {
      example: {
        status: 'error',
        info: {
          database: { status: 'up' },
        },
        error: {
          redis: {
            status: 'down',
            message: 'Connection refused',
          },
        },
        details: {
          database: { status: 'up' },
          redis: {
            status: 'down',
            message: 'Connection refused',
          },
        },
      },
    },
  })
  check() {
    return this.health.check([
      // PostgreSQL database connection (timeout: 3 seconds)
      () => this.db.pingCheck('database', { timeout: 3000 }),

      // Redis cache connection and operations
      () => this.redis.isHealthy('redis'),

      // Email/SMTP connection verification
      () => this.email.isHealthy('smtp'),

      // Memory heap usage (alert if > 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Memory RSS usage (alert if > 500MB)
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Disk storage (alert if > 90% full)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Public()
  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check' })
  checkDb() {
    return this.health.check([() => this.db.pingCheck('database', { timeout: 3000 })]);
  }

  @Public()
  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis health check' })
  checkRedis() {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }

  @Public()
  @Get('email')
  @HealthCheck()
  @ApiOperation({ summary: 'Email service health check' })
  checkEmail() {
    return this.health.check([() => this.email.isHealthy('smtp')]);
  }
}
