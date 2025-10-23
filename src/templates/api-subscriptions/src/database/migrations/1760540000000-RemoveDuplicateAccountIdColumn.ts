import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateAccountIdColumn1760540000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove duplicate accountId varchar column from users table
    // The correct column is account_id (uuid) with foreign key
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the column if needed for rollback
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "accountId" varchar NULL`);
  }
}
