import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CurrencyRepository } from '../repositories/currency.repository';
import { Currency } from '../entities/currency.entity';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private currencyRepository: CurrencyRepository) {}

  /**
   * Get all active currencies
   */
  async getActiveCurrencies(): Promise<Currency[]> {
    return this.currencyRepository.findActiveCurrencies();
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency> {
    const currency = await this.currencyRepository.findByCode(code);
    if (!currency) {
      throw new NotFoundException(`Currency ${code} not found`);
    }
    if (!currency.isActive) {
      throw new NotFoundException(`Currency ${code} is not active`);
    }
    return currency;
  }

  /**
   * Get default currency
   */
  async getDefaultCurrency(): Promise<Currency> {
    const currency = await this.currencyRepository.findDefaultCurrency();
    if (!currency) {
      // Fallback to MXN if no default is set
      return this.getCurrencyByCode('MXN');
    }
    return currency;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const from = await this.getCurrencyByCode(fromCurrency);
    const to = await this.getCurrencyByCode(toCurrency);

    // Convert to USD first, then to target currency
    const amountInUSD = amount / Number(from.exchangeRateToUSD);
    const convertedAmount = amountInUSD * Number(to.exchangeRateToUSD);

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: Currency): string {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }

  /**
   * Update exchange rates (for admin or cron job)
   */
  async updateExchangeRate(code: string, rate: number): Promise<void> {
    // Validate currency exists
    await this.getCurrencyByCode(code);
    await this.currencyRepository.updateExchangeRate(code, rate);
    this.logger.log(`Exchange rate updated for ${code}: ${rate}`);
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const from = await this.getCurrencyByCode(fromCurrency);
    const to = await this.getCurrencyByCode(toCurrency);

    const rate = Number(to.exchangeRateToUSD) / Number(from.exchangeRateToUSD);
    return Math.round(rate * 1000000) / 1000000; // 6 decimal precision
  }
}
