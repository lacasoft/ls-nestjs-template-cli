import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLocationsTable1728677300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'locations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'zipCode',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Foreign key para account
    await queryRunner.createForeignKey(
      'locations',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índice para búsqueda por account_id
    await queryRunner.query(`
      CREATE INDEX idx_locations_account_id ON locations(account_id);
    `);

    // Índice para búsqueda por código
    await queryRunner.query(`
      CREATE INDEX idx_locations_code ON locations(code);
    `);

    // Índice para búsqueda por estado activo
    await queryRunner.query(`
      CREATE INDEX idx_locations_is_active ON locations("isActive");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_locations_is_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_locations_code;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_locations_account_id;`);

    // Eliminar foreign keys
    const table = await queryRunner.getTable('locations');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('locations', foreignKey);
      }
    }

    // Eliminar tabla
    await queryRunner.dropTable('locations');
  }
}
