import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';

@Injectable()
export class CurrencyRepository extends Repository<Currency> {
  constructor(private dataSource: DataSource) {
    super(Currency, dataSource.createEntityManager());
  }

  async findByCode(code: string): Promise<Currency | null> {
    return this.findOne({ where: { code: code.toUpperCase() } });
  }

  async findActiveCurrencies(): Promise<Currency[]> {
    return this.find({ where: { isActive: true }, order: { code: 'ASC' } });
  }

  async findDefaultCurrency(): Promise<Currency | null> {
    return this.findOne({ where: { isDefault: true } });
  }

  async updateExchangeRate(code: string, rate: number): Promise<void> {
    await this.update(
      { code: code.toUpperCase() },
      { exchangeRateToUSD: rate, updatedAt: new Date() },
    );
  }
}
