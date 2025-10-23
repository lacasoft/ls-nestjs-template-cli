import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionRepository extends Repository<Subscription> {
  constructor(private dataSource: DataSource) {
    super(Subscription, dataSource.createEntityManager());
  }

  async findByAccountId(accountId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { account: { id: accountId } },
      relations: ['plan', 'account'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByAccountId(accountId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { account: { id: accountId }, status: SubscriptionStatus.ACTIVE },
      relations: ['plan', 'account'],
    });
  }

  /**
   * Find a subscription with ACTIVE or TRIAL status for an account
   * This is used to check if an account has a valid subscription for using features
   */
  async findUsableByAccountId(accountId: string): Promise<Subscription | null> {
    return this.createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.account', 'account')
      .where('subscription.account_id = :accountId', { accountId })
      .andWhere('subscription.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .orderBy('subscription.createdAt', 'DESC')
      .getOne();
  }
}
