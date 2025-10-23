import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PlansService } from '../plans/plans.service';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class FeaturesService {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private plansService: PlansService,
  ) {}

  /**
   * Check if a feature is available for the user's account
   */
  async checkFeature(
    userId: string,
    featureCode: string,
  ): Promise<{
    available: boolean;
    reason?: string;
    planName?: string;
    upgradeRequired?: boolean;
  }> {
    // Get user's active subscription
    const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);

    if (!subscription) {
      return {
        available: false,
        reason: 'No active subscription found',
        upgradeRequired: true,
      };
    }

    // Check subscription status
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIAL
    ) {
      return {
        available: false,
        reason: `Subscription is ${subscription.status}`,
        planName: subscription.plan.name,
        upgradeRequired:
          subscription.status === SubscriptionStatus.CANCELED ||
          subscription.status === SubscriptionStatus.EXPIRED,
      };
    }

    // Check if feature is included in plan
    const plan = subscription.plan;
    const features = plan.features || [];

    const hasFeature = features.includes(featureCode);

    if (!hasFeature) {
      return {
        available: false,
        reason: 'Feature not included in current plan',
        planName: plan.name,
        upgradeRequired: true,
      };
    }

    return {
      available: true,
      planName: plan.name,
    };
  }

  /**
   * Get usage statistics for the user's account
   */
  async getUsage(userId: string): Promise<{
    plan: {
      name: string;
      status: string;
      features: string[];
    };
    usage: {
      users: {
        current: number;
        limit: number | null;
        unlimited: boolean;
      };
      locations: {
        current: number;
        limit: number | null;
        unlimited: boolean;
      };
    };
    subscription: {
      status: string;
      currentPeriodEnd: Date | null;
      trialEndsAt: Date | null;
      autoRenew: boolean;
    };
  }> {
    const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const plan = subscription.plan;

    // Get account statistics
    const accountId = subscription.accountId;

    // Count users in account
    const usersCount = await this.countAccountUsers(accountId);

    // Count locations in account
    const locationsCount = await this.countAccountLocations(accountId);

    return {
      plan: {
        name: plan.name,
        status: plan.status,
        features: plan.features || [],
      },
      usage: {
        users: {
          current: usersCount,
          limit: plan.maxUsers,
          unlimited: plan.maxUsers === null,
        },
        locations: {
          current: locationsCount,
          limit: plan.maxLocations,
          unlimited: plan.maxLocations === null,
        },
      },
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.endsAt,
        trialEndsAt: subscription.trialEndsAt,
        autoRenew: subscription.autoRenew,
      },
    };
  }

  /**
   * Check if account has reached user limit
   */
  async canAddUser(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number | null;
  }> {
    const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);

    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription',
        current: 0,
        limit: null,
      };
    }

    const plan = subscription.plan;
    const accountId = subscription.accountId;
    const usersCount = await this.countAccountUsers(accountId);

    // No limit
    if (plan.maxUsers === null) {
      return {
        allowed: true,
        current: usersCount,
        limit: null,
      };
    }

    // Check if limit reached
    if (usersCount >= plan.maxUsers) {
      return {
        allowed: false,
        reason: 'User limit reached for current plan',
        current: usersCount,
        limit: plan.maxUsers,
      };
    }

    return {
      allowed: true,
      current: usersCount,
      limit: plan.maxUsers,
    };
  }

  /**
   * Check if account has reached location limit
   */
  async canAddLocation(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number | null;
  }> {
    const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);

    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription',
        current: 0,
        limit: null,
      };
    }

    const plan = subscription.plan;
    const accountId = subscription.accountId;
    const locationsCount = await this.countAccountLocations(accountId);

    // No limit
    if (plan.maxLocations === null) {
      return {
        allowed: true,
        current: locationsCount,
        limit: null,
      };
    }

    // Check if limit reached
    if (locationsCount >= plan.maxLocations) {
      return {
        allowed: false,
        reason: 'Location limit reached for current plan',
        current: locationsCount,
        limit: plan.maxLocations,
      };
    }

    return {
      allowed: true,
      current: locationsCount,
      limit: plan.maxLocations,
    };
  }

  private async countAccountUsers(_accountId: string): Promise<number> {
    // This would use UsersService to count users
    // For now, returning a placeholder
    return 0;
  }

  private async countAccountLocations(_accountId: string): Promise<number> {
    // This would use LocationsService to count locations
    // For now, returning a placeholder
    return 0;
  }
}
