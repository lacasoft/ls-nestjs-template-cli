import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaymentPeriod } from '../entities/payment-period.entity';

@Injectable()
export class PaymentPeriodRepository extends Repository<PaymentPeriod> {
  constructor(private dataSource: DataSource) {
    super(PaymentPeriod, dataSource.createEntityManager());
  }

  async findBySubscriptionId(subscriptionId: string): Promise<PaymentPeriod[]> {
    return this.find({
      where: { subscription: { id: subscriptionId } },
      order: { periodStartsAt: 'DESC' },
    });
  }
}
