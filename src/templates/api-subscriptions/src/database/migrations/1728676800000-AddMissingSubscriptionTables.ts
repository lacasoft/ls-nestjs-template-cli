import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddMissingSubscriptionTables1728676800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla locations
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
            isNullable: false,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'postalCode',
            type: 'varchar',
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
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // FK: locations -> accounts
    await queryRunner.createForeignKey(
      'locations',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 2. Crear tabla system_config
    await queryRunner.createTable(
      new Table({
        name: 'system_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 3. Crear tabla invitation_tokens
    await queryRunner.createTable(
      new Table({
        name: 'invitation_tokens',
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
            name: 'email',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'expired', 'revoked'],
            default: "'pending'",
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'invited_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'accepted_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'acceptedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // FKs para invitation_tokens
    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['invited_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['accepted_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Índices para invitation_tokens
    await queryRunner.createIndex(
      'invitation_tokens',
      new TableIndex({
        name: 'IDX_invitation_tokens_token',
        columnNames: ['token'],
      }),
    );

    await queryRunner.createIndex(
      'invitation_tokens',
      new TableIndex({
        name: 'IDX_invitation_tokens_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'invitation_tokens',
      new TableIndex({
        name: 'IDX_invitation_tokens_status',
        columnNames: ['status'],
      }),
    );

    // 4. Crear tabla notifications
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            name: 'type',
            type: 'enum',
            enum: [
              'subscription_created',
              'subscription_renewed',
              'subscription_canceled',
              'subscription_expiring',
              'payment_success',
              'payment_failed',
              'trial_expiring',
              'invitation_sent',
              'user_added',
              'general',
            ],
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // FK: notifications -> users
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índices para notifications
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_isRead',
        columnNames: ['user_id', 'isRead'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_type',
        columnNames: ['type'],
      }),
    );

    // 5. Crear tabla audit_logs
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            isNullable: true,
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['create', 'update', 'delete', 'login', 'logout', 'access'],
            isNullable: false,
          },
          {
            name: 'entity',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'entityId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'oldValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // FKs para audit_logs
    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Índices para audit_logs
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_account_id',
        columnNames: ['account_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_entity_entityId',
        columnNames: ['entity', 'entityId'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // 6. Limpiar campo duplicado accountId en users
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "accountId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas en orden inverso
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('notifications', true);
    await queryRunner.dropTable('invitation_tokens', true);
    await queryRunner.dropTable('system_config', true);
    await queryRunner.dropTable('locations', true);

    // Restaurar campo accountId en users
    await queryRunner.query(`ALTER TABLE users ADD COLUMN "accountId" varchar`);
  }
}
