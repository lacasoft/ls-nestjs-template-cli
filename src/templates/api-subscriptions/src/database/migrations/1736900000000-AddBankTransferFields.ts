import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankTransferFields1736900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new bank transfer fields to transactions table
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "receiptFileName" varchar(255) NULL,
      ADD COLUMN IF NOT EXISTS "receiptMimeType" varchar(100) NULL,
      ADD COLUMN IF NOT EXISTS "approvedBy" uuid NULL,
      ADD COLUMN IF NOT EXISTS "approvedAt" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "rejectionReason" text NULL;
    `);

    // Add foreign key for approvedBy
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_transaction_approved_by'
        ) THEN
          ALTER TABLE "transactions"
          ADD CONSTRAINT "FK_transaction_approved_by"
          FOREIGN KEY ("approvedBy") REFERENCES "users"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP CONSTRAINT IF EXISTS "FK_transaction_approved_by";
    `);

    // Remove bank transfer fields
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN IF EXISTS "receiptFileName",
      DROP COLUMN IF EXISTS "receiptMimeType",
      DROP COLUMN IF EXISTS "approvedBy",
      DROP COLUMN IF EXISTS "approvedAt",
      DROP COLUMN IF EXISTS "rejectionReason";
    `);
  }
}
