import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMfaToUsers1736900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add MFA columns to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "mfa_enabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "mfa_secret" varchar(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove MFA columns from users table
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "mfa_secret",
      DROP COLUMN IF EXISTS "mfa_enabled";
    `);
  }
}
