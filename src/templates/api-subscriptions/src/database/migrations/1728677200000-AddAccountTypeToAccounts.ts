import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAccountTypeToAccounts1728677200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el tipo enum
    await queryRunner.query(`
      CREATE TYPE accounts_account_type_enum AS ENUM ('individual', 'tenant');
    `);

    // Agregar la columna account_type con valor por defecto
    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'account_type',
        type: 'accounts_account_type_enum',
        default: "'individual'",
        isNullable: false,
      }),
    );

    // Crear índice para consultas por tipo de cuenta
    await queryRunner.query(`
      CREATE INDEX idx_accounts_account_type ON accounts(account_type);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`DROP INDEX IF EXISTS idx_accounts_account_type;`);

    // Eliminar columna
    await queryRunner.dropColumn('accounts', 'account_type');

    // Eliminar tipo enum
    await queryRunner.query(`DROP TYPE IF EXISTS accounts_account_type_enum;`);
  }
}
