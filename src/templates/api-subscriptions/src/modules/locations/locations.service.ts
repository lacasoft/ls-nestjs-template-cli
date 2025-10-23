import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LocationRepository } from './repositories/location.repository';
import { SubscriptionRepository } from '../subscriptions/repositories/subscription.repository';
import { AccountRepository } from '../accounts/repositories/account.repository';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { AccountType } from '../accounts/entities/account.entity';

@Injectable()
export class LocationsService {
  constructor(
    private locationRepository: LocationRepository,
    private subscriptionRepository: SubscriptionRepository,
    private accountRepository: AccountRepository,
  ) {}

  async create(createLocationDto: CreateLocationDto, accountId: string): Promise<Location> {
    // 1. Validate that the account is a tenant account
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.accountType !== AccountType.TENANT) {
      throw new ForbiddenException('Only tenant accounts can create locations');
    }

    // 2. Get the active or trial subscription and validate location limits
    const subscription = await this.subscriptionRepository.findUsableByAccountId(accountId);
    if (!subscription) {
      throw new BadRequestException('No active or trial subscription found');
    }

    // 3. Check if the plan allows locations
    if (!subscription.plan.maxLocations || subscription.plan.maxLocations === 0) {
      throw new ForbiddenException('Your current plan does not allow locations');
    }

    // 4. Count existing locations and validate against plan limit
    const currentLocationCount = await this.locationRepository.countByAccountId(accountId);
    if (currentLocationCount >= subscription.plan.maxLocations) {
      throw new BadRequestException(
        `You have reached the maximum number of locations (${subscription.plan.maxLocations}) allowed by your plan`,
      );
    }

    // 5. Create the location
    const location = this.locationRepository.create({
      ...createLocationDto,
      account,
    });

    return this.locationRepository.save(location);
  }

  async findAll(accountId: string): Promise<Location[]> {
    return this.locationRepository.findByAccountId(accountId);
  }

  async findOne(id: string, accountId: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id, account: { id: accountId } },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
    accountId: string,
  ): Promise<Location> {
    const location = await this.findOne(id, accountId);

    Object.assign(location, updateLocationDto);

    return this.locationRepository.save(location);
  }

  async remove(id: string, accountId: string): Promise<void> {
    const location = await this.findOne(id, accountId);

    await this.locationRepository.softDeleteLocation(location.id);
  }
}
