import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateInvoicesTable1737100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'transaction_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'draft'",
          },
          {
            name: 'issue_date',
            type: 'date',
          },
          {
            name: 'due_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'tax_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'discount_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'items',
            type: 'jsonb',
          },
          {
            name: 'billing_address',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pdf_path',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email_sent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'email_sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Foreign key to users
    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key to transactions
    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['transaction_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'transactions',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_invoices_user_id ON invoices (user_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_invoices_transaction_id ON invoices (transaction_id)`,
    );
    await queryRunner.query(`CREATE INDEX idx_invoices_status ON invoices (status)`);
    await queryRunner.query(`CREATE INDEX idx_invoices_issue_date ON invoices (issue_date)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invoices');
  }
}
