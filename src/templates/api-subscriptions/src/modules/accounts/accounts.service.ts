import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from './repositories/account.repository';
import { Account } from './entities/account.entity';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private accountRepository: AccountRepository) {}

  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async findBySlug(slug: string): Promise<Account> {
    const account = await this.accountRepository.findBySlug(slug);

    if (!account) {
      throw new NotFoundException(`Account with slug ${slug} not found`);
    }

    return account;
  }

  async findWithUsers(id: string): Promise<Account> {
    const account = await this.accountRepository.findWithUsers(id);

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    // Update fields
    if (updateAccountDto.name !== undefined) {
      account.name = updateAccountDto.name;
    }
    if (updateAccountDto.description !== undefined) {
      account.description = updateAccountDto.description;
    }
    if (updateAccountDto.logo !== undefined) {
      account.logo = updateAccountDto.logo;
    }
    if (updateAccountDto.settings !== undefined) {
      account.settings = { ...account.settings, ...updateAccountDto.settings };
    }

    return this.accountRepository.save(account);
  }
}
