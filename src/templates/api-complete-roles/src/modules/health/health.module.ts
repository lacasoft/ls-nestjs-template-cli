import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { EmailHealthIndicator } from './indicators/email.health';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [TerminusModule, EmailModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, EmailHealthIndicator],
})
export class HealthModule {}
