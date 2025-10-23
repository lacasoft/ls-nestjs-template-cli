import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountRepository } from './repositories/account.repository';
import { Account } from './entities/account.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), UsersModule],
  controllers: [AccountsController],
  providers: [AccountsService, AccountRepository],
  exports: [AccountsService, AccountRepository],
})
export class AccountsModule {}
