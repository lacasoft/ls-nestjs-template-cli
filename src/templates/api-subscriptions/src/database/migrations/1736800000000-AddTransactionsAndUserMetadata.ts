import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionsAndUserMetadata1736800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add metadata column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "metadata" jsonb NULL;
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "subscription_id" uuid NULL,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "payment_method" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "transaction_type" varchar(50) NOT NULL DEFAULT 'subscription_payment',
        "stripe_payment_intent_id" varchar(255) NULL,
        "stripe_charge_id" varchar(255) NULL,
        "stripe_customer_id" varchar(255) NULL,
        "paypal_order_id" varchar(255) NULL,
        "paypal_capture_id" varchar(255) NULL,
        "bank_transfer_reference" text NULL,
        "bank_transfer_proof_url" varchar(500) NULL,
        "metadata" jsonb NULL,
        "description" text NULL,
        "error_message" text NULL,
        "paid_at" timestamp NULL,
        "refunded_at" timestamp NULL,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_users_transactions"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_transactions"
          FOREIGN KEY ("subscription_id")
          REFERENCES "subscriptions"("id")
          ON DELETE SET NULL
      );
    `);

    // Create indexes for transactions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_user_id"
      ON "transactions" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_subscription_id"
      ON "transactions" ("subscription_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_stripe_payment_intent_id"
      ON "transactions" ("stripe_payment_intent_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_status"
      ON "transactions" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_payment_method"
      ON "transactions" ("payment_method");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_payment_method"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_stripe_payment_intent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_subscription_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_user_id"`);

    // Drop transactions table
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);

    // Remove metadata column from users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "metadata"`);
  }
}
