import { DataSource } from 'typeorm';
import { Currency } from '../../modules/payments/entities/currency.entity';

export async function seedCurrencies(dataSource: DataSource): Promise<void> {
  const currencyRepository = dataSource.getRepository(Currency);

  // Verificar si ya existen monedas
  const existingCurrencies = await currencyRepository.count();
  if (existingCurrencies > 0) {
    console.log('✓ Currencies already seeded, skipping...');
    return;
  }

  const currencies = [
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      exchangeRateToUSD: 1.0,
      isActive: true,
      isDefault: false,
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      exchangeRateToUSD: 0.92,
      isActive: true,
      isDefault: false,
    },
    {
      code: 'MXN',
      name: 'Mexican Peso',
      symbol: '$',
      exchangeRateToUSD: 17.5,
      isActive: true,
      isDefault: true,
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      exchangeRateToUSD: 0.79,
      isActive: true,
      isDefault: false,
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      exchangeRateToUSD: 1.36,
      isActive: true,
      isDefault: false,
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      exchangeRateToUSD: 1.52,
      isActive: true,
      isDefault: false,
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      exchangeRateToUSD: 149.5,
      isActive: true,
      isDefault: false,
    },
    {
      code: 'BRL',
      name: 'Brazilian Real',
      symbol: 'R$',
      exchangeRateToUSD: 4.95,
      isActive: true,
      isDefault: false,
    },
  ];

  // Crear monedas
  const createdCurrencies = currencyRepository.create(currencies);
  await currencyRepository.save(createdCurrencies);

  console.log(`✓ Successfully seeded ${createdCurrencies.length} currencies`);
}
