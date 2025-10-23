import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultiCurrencyToPlans1737100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add currency and prices columns to plans table
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "prices" jsonb NULL;
    `);

    // Populate prices jsonb with existing price in USD
    await queryRunner.query(`
      UPDATE "plans"
      SET "prices" = jsonb_build_object('USD', "price")
      WHERE "prices" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      DROP COLUMN IF EXISTS "prices",
      DROP COLUMN IF EXISTS "currency";
    `);
  }
}
