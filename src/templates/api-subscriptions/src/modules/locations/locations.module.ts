import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationUsersController } from './location-users.controller';
import { LocationsService } from './locations.service';
import { LocationUsersService } from './location-users.service';
import { LocationRepository } from './repositories/location.repository';
import { UserLocationRepository } from './repositories/user-location.repository';
import { Location } from './entities/location.entity';
import { UserLocation } from './entities/user-location.entity';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountsModule } from '../accounts/accounts.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, UserLocation]),
    UsersModule,
    forwardRef(() => SubscriptionsModule),
    AccountsModule,
    InvitationsModule,
    RolesModule,
  ],
  controllers: [LocationsController, LocationUsersController],
  providers: [LocationsService, LocationUsersService, LocationRepository, UserLocationRepository],
  exports: [LocationsService, LocationUsersService, LocationRepository, UserLocationRepository],
})
export class LocationsModule {}
