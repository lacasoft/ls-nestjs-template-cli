import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUserLocationsTable1728678000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for location role types if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_locations_role_enum AS ENUM (
          'admin_root',
          'admin_local',
          'supervisor',
          'observer'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user_locations table
    await queryRunner.createTable(
      new Table({
        name: 'user_locations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'location_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'user_locations_role_enum',
            default: "'observer'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
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
          },
        ],
      }),
      true,
    );

    // Create unique index on user_id + location_id
    await queryRunner.createIndex(
      'user_locations',
      new TableIndex({
        name: 'idx_user_locations_user_location_unique',
        columnNames: ['user_id', 'location_id'],
        isUnique: true,
      }),
    );

    // Create index on user_id for faster lookups
    await queryRunner.createIndex(
      'user_locations',
      new TableIndex({
        name: 'idx_user_locations_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create index on location_id for faster lookups
    await queryRunner.createIndex(
      'user_locations',
      new TableIndex({
        name: 'idx_user_locations_location_id',
        columnNames: ['location_id'],
      }),
    );

    // Create index on role
    await queryRunner.createIndex(
      'user_locations',
      new TableIndex({
        name: 'idx_user_locations_role',
        columnNames: ['role'],
      }),
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'user_locations',
      new TableForeignKey({
        name: 'fk_user_locations_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add foreign key to locations table
    await queryRunner.createForeignKey(
      'user_locations',
      new TableForeignKey({
        name: 'fk_user_locations_location',
        columnNames: ['location_id'],
        referencedTableName: 'locations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('user_locations', 'fk_user_locations_location');
    await queryRunner.dropForeignKey('user_locations', 'fk_user_locations_user');

    // Drop indexes
    await queryRunner.dropIndex('user_locations', 'idx_user_locations_role');
    await queryRunner.dropIndex('user_locations', 'idx_user_locations_location_id');
    await queryRunner.dropIndex('user_locations', 'idx_user_locations_user_id');
    await queryRunner.dropIndex('user_locations', 'idx_user_locations_user_location_unique');

    // Drop table
    await queryRunner.dropTable('user_locations');

    // Drop enum
    await queryRunner.query('DROP TYPE user_locations_role_enum;');
  }
}
