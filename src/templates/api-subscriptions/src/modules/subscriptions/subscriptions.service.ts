import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { PaymentPeriodRepository } from './repositories/payment-period.repository';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { PaymentPeriod, PaymentPeriodStatus } from './entities/payment-period.entity';
import { PlanRepository } from '../plans/repositories/plan.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { LocationRepository } from '../locations/repositories/location.repository';
import { UpgradeSubscriptionDto, UpgradeTimingType } from './dto/upgrade-subscription.dto';
import { DowngradeSubscriptionDto } from './dto/downgrade-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { In } from 'typeorm';

@Injectable()
export class SubscriptionsService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private paymentPeriodRepository: PaymentPeriodRepository,
    private planRepository: PlanRepository,
    private userRepository: UserRepository,
    private locationRepository: LocationRepository,
  ) {}

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan', 'account'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async findByAccountId(accountId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findByAccountId(accountId);

    if (!subscription) {
      throw new NotFoundException(`No subscription found for account ${accountId}`);
    }

    return subscription;
  }

  async findActiveByAccountId(accountId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findActiveByAccountId(accountId);
  }

  async findPaymentPeriodsBySubscriptionId(subscriptionId: string): Promise<PaymentPeriod[]> {
    return this.paymentPeriodRepository.findBySubscriptionId(subscriptionId);
  }

  /**
   * Get user's active subscription with plan details
   */
  async getUserActiveSubscription(userId: string): Promise<Subscription | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.accountId) {
      return null;
    }

    return this.subscriptionRepository.findOne({
      where: {
        accountId: user.accountId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
      relations: ['plan', 'account'],
    });
  }

  /**
   * Upgrade subscription to a higher tier plan
   */
  async upgradeSubscription(
    upgradeDto: UpgradeSubscriptionDto,
    requestingUserId: string,
  ): Promise<{
    message: string;
    subscription: Subscription;
    paymentPeriod?: PaymentPeriod;
    newPlan: any;
  }> {
    let subscription: Subscription | null;

    // If subscriptionId not provided, get user's active subscription
    if (!upgradeDto.subscriptionId) {
      const user = await this.userRepository.findOne({
        where: { id: requestingUserId },
      });

      if (!user || !user.accountId) {
        throw new NotFoundException('User has no account or subscription');
      }

      subscription = await this.subscriptionRepository.findOne({
        where: {
          account: { id: user.accountId },
          status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
        },
        relations: ['plan', 'account'],
      });

      if (!subscription) {
        throw new NotFoundException('No active subscription found for user');
      }
    } else {
      // Get subscription with relations
      subscription = await this.subscriptionRepository.findOne({
        where: { id: upgradeDto.subscriptionId },
        relations: ['plan', 'account'],
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Verify user has access to this subscription
      await this.verifyUserAccessToSubscription(requestingUserId, subscription.accountId);
    }

    // Final null check (should never happen after above checks, but helps TypeScript)
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify subscription is active
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIAL
    ) {
      throw new BadRequestException('Can only upgrade active or trial subscriptions');
    }

    // Get new plan
    const newPlan = await this.planRepository.findOne({
      where: { id: upgradeDto.newPlanId },
    });

    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    // Verify it's actually an upgrade (higher price)
    if (parseFloat(newPlan.price.toString()) <= parseFloat(subscription.plan.price.toString())) {
      throw new BadRequestException(
        'New plan must be higher tier (higher price) than current plan',
      );
    }

    const timing = upgradeDto.timing || UpgradeTimingType.NEXT_PERIOD;

    if (timing === UpgradeTimingType.IMMEDIATE) {
      // Immediate upgrade (not implemented in this version - requires prorated billing)
      throw new BadRequestException(
        'Immediate upgrades are not yet supported. Please use next_period timing.',
      );
    }

    // Schedule upgrade for next period
    const nextBillingDate = subscription.nextBillingDate || new Date();
    const periodEnd = new Date(nextBillingDate);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Assuming monthly billing

    // Create future payment period with new plan
    const futurePaymentPeriod = this.paymentPeriodRepository.create({
      subscriptionId: subscription.id,
      periodStartsAt: nextBillingDate,
      periodEndsAt: periodEnd,
      amount: newPlan.price,
      status: PaymentPeriodStatus.PENDING,
    });

    await this.paymentPeriodRepository.save(futurePaymentPeriod);

    // Update subscription metadata to track pending upgrade
    subscription.metadata = {
      ...subscription.metadata,
      pendingUpgrade: {
        newPlanId: newPlan.id,
        newPlanName: newPlan.name,
        scheduledFor: nextBillingDate,
        createdAt: new Date(),
      },
    };

    await this.subscriptionRepository.save(subscription);

    return {
      message: `Subscription will be upgraded to ${newPlan.name} plan on ${nextBillingDate.toISOString()}`,
      subscription,
      paymentPeriod: futurePaymentPeriod,
      newPlan,
    };
  }

  /**
   * Downgrade subscription to a lower tier plan
   */
  async downgradeSubscription(
    downgradeDto: DowngradeSubscriptionDto,
    requestingUserId: string,
  ): Promise<{ message: string; subscription: Subscription }> {
    let subscription: Subscription | null;

    // If subscriptionId not provided, get user's active subscription
    if (!downgradeDto.subscriptionId) {
      const user = await this.userRepository.findOne({
        where: { id: requestingUserId },
      });

      if (!user || !user.accountId) {
        throw new NotFoundException('User has no account or subscription');
      }

      subscription = await this.subscriptionRepository.findOne({
        where: {
          account: { id: user.accountId },
          status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
        },
        relations: ['plan', 'account'],
      });

      if (!subscription) {
        throw new NotFoundException('No active subscription found for user');
      }
    } else {
      // Get subscription with relations
      subscription = await this.subscriptionRepository.findOne({
        where: { id: downgradeDto.subscriptionId },
        relations: ['plan', 'account'],
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Verify user has access
      await this.verifyUserAccessToSubscription(requestingUserId, subscription.accountId);
    }

    // Final null check (should never happen after above checks, but helps TypeScript)
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify subscription is active
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIAL
    ) {
      throw new BadRequestException('Can only downgrade active or trial subscriptions');
    }

    // Get new plan
    const newPlan = await this.planRepository.findOne({
      where: { id: downgradeDto.newPlanId },
    });

    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    // Verify it's actually a downgrade (lower price)
    if (parseFloat(newPlan.price.toString()) >= parseFloat(subscription.plan.price.toString())) {
      throw new BadRequestException('New plan must be lower tier (lower price) than current plan');
    }

    // Validate new plan limits against current usage
    await this.validateDowngradeLimits(subscription.accountId, newPlan);

    // Schedule downgrade for next period (no immediate downgrade)
    const nextBillingDate = subscription.nextBillingDate || new Date();

    // Update subscription metadata to track pending downgrade
    subscription.metadata = {
      ...subscription.metadata,
      pendingDowngrade: {
        newPlanId: newPlan.id,
        newPlanName: newPlan.name,
        scheduledFor: nextBillingDate,
        createdAt: new Date(),
        ...(downgradeDto.reason && { reason: downgradeDto.reason }),
      },
    };

    await this.subscriptionRepository.save(subscription);

    return {
      message: `Subscription will be downgraded to ${newPlan.name} plan on ${nextBillingDate.toISOString()}. Please ensure your usage is within the new plan limits before the change.`,
      subscription,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    cancelDto: CancelSubscriptionDto,
    requestingUserId: string,
  ): Promise<{ message: string; subscription: Subscription }> {
    let subscription: Subscription | null;

    // If subscriptionId not provided, get user's active subscription
    if (!cancelDto.subscriptionId) {
      const user = await this.userRepository.findOne({
        where: { id: requestingUserId },
      });

      if (!user || !user.accountId) {
        throw new NotFoundException('User has no account or subscription');
      }

      subscription = await this.subscriptionRepository.findOne({
        where: {
          account: { id: user.accountId },
          status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
        },
        relations: ['plan', 'account'],
      });

      if (!subscription) {
        throw new NotFoundException('No active subscription found for user');
      }
    } else {
      // Get subscription by ID
      subscription = await this.subscriptionRepository.findOne({
        where: { id: cancelDto.subscriptionId },
        relations: ['plan', 'account'],
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Verify user has access
      await this.verifyUserAccessToSubscription(requestingUserId, subscription.accountId);
    }

    // Verify subscription is not already canceled
    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already canceled');
    }

    // Default to cancel at end of period if not specified
    const cancelAtPeriodEnd = cancelDto.cancelAtPeriodEnd !== false;

    // Store cancellation metadata
    subscription.metadata = {
      ...subscription.metadata,
      cancellation: {
        canceledAt: new Date(),
        ...(cancelDto.reason && { reason: cancelDto.reason }),
        ...(cancelDto.feedback && { feedback: cancelDto.feedback }),
      },
    };

    if (!cancelAtPeriodEnd) {
      // Immediate cancellation
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.cancelReason = cancelDto.reason || 'User requested immediate cancellation';
      subscription.endsAt = new Date();
      subscription.autoRenew = false;

      await this.subscriptionRepository.save(subscription);

      return {
        message:
          'Subscription canceled immediately. You no longer have access to premium features.',
        subscription,
      };
    } else {
      // Cancel at end of period
      subscription.autoRenew = false;
      subscription.canceledAt = new Date();
      subscription.cancelReason = cancelDto.reason || 'User requested cancellation at period end';
      subscription.endsAt = subscription.nextBillingDate || new Date();

      await this.subscriptionRepository.save(subscription);

      return {
        message: `Subscription will be canceled on ${subscription.endsAt.toISOString()}. You will retain access until then.`,
        subscription,
      };
    }
  }

  /**
   * Verify user has access to subscription (is owner or belongs to account)
   */
  private async verifyUserAccessToSubscription(userId: string, accountId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.accountId !== accountId) {
      throw new ForbiddenException('You do not have access to this subscription');
    }
  }

  /**
   * Validate that current usage fits within new plan limits
   */
  private async validateDowngradeLimits(accountId: string, newPlan: any): Promise<void> {
    // Check user count
    if (newPlan.maxUsers && newPlan.maxUsers > 0) {
      const userCount = await this.userRepository.count({
        where: { accountId },
      });

      if (userCount > newPlan.maxUsers) {
        throw new BadRequestException(
          `Cannot downgrade: Current user count (${userCount}) exceeds new plan limit (${newPlan.maxUsers})`,
        );
      }
    }

    // Check location count
    if (newPlan.maxLocations !== null && newPlan.maxLocations !== undefined) {
      const locationCount = await this.locationRepository.count({
        where: { accountId },
      });

      if (newPlan.maxLocations === 0 && locationCount > 0) {
        throw new BadRequestException(
          `Cannot downgrade: New plan does not support locations but you have ${locationCount} active location(s)`,
        );
      }

      if (newPlan.maxLocations > 0 && locationCount > newPlan.maxLocations) {
        throw new BadRequestException(
          `Cannot downgrade: Current location count (${locationCount}) exceeds new plan limit (${newPlan.maxLocations})`,
        );
      }
    }
  }

  /**
   * Update subscription after successful payment
   */
  async updateSubscriptionAfterPayment(
    subscriptionId: string,
    updates: {
      status?: SubscriptionStatus;
      nextBillingDate?: Date;
      endsAt?: Date;
      startsAt?: Date;
    },
  ): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (updates.status) {
      subscription.status = updates.status;
    }
    if (updates.nextBillingDate) {
      subscription.nextBillingDate = updates.nextBillingDate;
    }
    if (updates.endsAt) {
      subscription.endsAt = updates.endsAt;
    }
    if (updates.startsAt) {
      subscription.startsAt = updates.startsAt;
    }

    return this.subscriptionRepository.save(subscription);
  }
}
