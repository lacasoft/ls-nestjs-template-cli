import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { SystemConfigRepository } from './repositories/system-config.repository';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig])],
  controllers: [SystemConfigController],
  providers: [SystemConfigRepository, SystemConfigService],
  exports: [SystemConfigRepository, SystemConfigService],
})
export class SystemConfigModule {}
