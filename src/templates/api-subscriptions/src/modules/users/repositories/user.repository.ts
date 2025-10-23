import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.find({ where: { isActive: true } });
  }

  async findByAccountId(accountId: string): Promise<User[]> {
    return this.find({
      where: { account: { id: accountId } },
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  async softDeleteUser(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async restoreUser(id: string): Promise<void> {
    await this.restore(id);
  }
}
