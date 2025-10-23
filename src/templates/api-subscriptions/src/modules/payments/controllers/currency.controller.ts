import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CurrencyService } from '../services/currency.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('currencies')
@Controller('currencies')
export class CurrencyController {
  constructor(private currencyService: CurrencyService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active currencies' })
  @ApiResponse({ status: 200, description: 'Returns list of active currencies' })
  async getCurrencies() {
    const currencies = await this.currencyService.getActiveCurrencies();
    return {
      success: true,
      data: currencies,
    };
  }

  @Public()
  @Get('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiQuery({ name: 'amount', type: Number, required: true })
  @ApiQuery({ name: 'from', type: String, required: true, description: 'Source currency code' })
  @ApiQuery({ name: 'to', type: String, required: true, description: 'Target currency code' })
  @ApiResponse({ status: 200, description: 'Returns converted amount' })
  async convertCurrency(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const convertedAmount = await this.currencyService.convertAmount(
      parseFloat(amount),
      from.toUpperCase(),
      to.toUpperCase(),
    );

    const rate = await this.currencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());

    return {
      success: true,
      data: {
        amount: parseFloat(amount),
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        convertedAmount,
        exchangeRate: rate,
      },
    };
  }

  @Public()
  @Get('default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default currency' })
  @ApiResponse({ status: 200, description: 'Returns default currency' })
  async getDefaultCurrency() {
    const currency = await this.currencyService.getDefaultCurrency();
    return {
      success: true,
      data: currency,
    };
  }
}
