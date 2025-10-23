import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCurrenciesTable1737000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing currencies table if it exists with wrong structure
    await queryRunner.query(`DROP TABLE IF EXISTS "currencies" CASCADE;`);

    // Create currencies table with correct structure
    await queryRunner.query(`
      CREATE TABLE "currencies" (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        code varchar(3) NOT NULL UNIQUE,
        name varchar(255) NOT NULL,
        symbol varchar(10) NOT NULL,
        exchange_rate_to_usd decimal(10,6) NOT NULL DEFAULT 1.0,
        is_active boolean NOT NULL DEFAULT true,
        is_default boolean NOT NULL DEFAULT false,
        metadata jsonb NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    // Create index on code
    await queryRunner.query(`
      CREATE INDEX idx_currencies_code ON currencies (code);
    `);

    // Insert default currencies
    await queryRunner.query(`
      INSERT INTO currencies (code, name, symbol, exchange_rate_to_usd, is_active, is_default)
      VALUES
        ('USD', 'US Dollar', '$', 1.0, true, true),
        ('EUR', 'Euro', '€', 0.92, true, false),
        ('GBP', 'British Pound', '£', 0.79, true, false),
        ('MXN', 'Mexican Peso', '$', 17.5, true, false),
        ('CAD', 'Canadian Dollar', 'C$', 1.35, true, false),
        ('AUD', 'Australian Dollar', 'A$', 1.52, true, false),
        ('JPY', 'Japanese Yen', '¥', 149.5, true, false),
        ('BRL', 'Brazilian Real', 'R$', 4.97, true, false);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_currencies_code;`);
    await queryRunner.query(`DROP TABLE IF EXISTS currencies;`);
  }
}
