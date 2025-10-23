import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';

@Injectable()
export class TransactionRepository extends Repository<Transaction> {
  constructor(private dataSource: DataSource) {
    super(Transaction, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.find({
      where: { userId },
      relations: ['subscription', 'subscription.plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Transaction[]> {
    return this.find({
      where: { subscriptionId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Transaction | null> {
    return this.findOne({
      where: { stripePaymentIntentId },
      relations: ['subscription', 'user'],
    });
  }

  async findByPayPalOrderId(paypalOrderId: string): Promise<Transaction | null> {
    return this.findOne({
      where: { paypalOrderId },
      relations: ['subscription', 'user'],
    });
  }

  async findPendingTransactions(): Promise<Transaction[]> {
    return this.find({
      where: { status: TransactionStatus.PENDING },
      relations: ['user', 'subscription', 'subscription.plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdWithPagination(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<[Transaction[], number]> {
    return this.findAndCount({
      where: { userId },
      relations: ['subscription', 'subscription.plan'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
