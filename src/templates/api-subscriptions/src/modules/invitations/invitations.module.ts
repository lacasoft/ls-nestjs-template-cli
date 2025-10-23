import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationTokenRepository } from './repositories/invitation-token.repository';
import { InvitationToken } from './entities/invitation-token.entity';
import { UsersModule } from '../users/users.module';
import { AccountsModule } from '../accounts/accounts.module';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([InvitationToken]), UsersModule, AccountsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationTokenRepository, EmailService],
  exports: [InvitationsService, InvitationTokenRepository],
})
export class InvitationsModule {}
