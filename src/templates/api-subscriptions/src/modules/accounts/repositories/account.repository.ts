import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Account } from '../entities/account.entity';

@Injectable()
export class AccountRepository extends Repository<Account> {
  constructor(private dataSource: DataSource) {
    super(Account, dataSource.createEntityManager());
  }

  async findBySlug(slug: string): Promise<Account | null> {
    return this.findOne({ where: { slug } });
  }

  async findWithUsers(id: string): Promise<Account | null> {
    return this.findOne({
      where: { id },
      relations: ['users'],
    });
  }
}
