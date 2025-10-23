import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddInvitationTokensTable1728677000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
            length: '255',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
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
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'invited_by_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'accepted_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'accepted_at',
            type: 'timestamp',
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
        ],
      }),
      true,
    );

    // Foreign key para account
    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key para role
    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key para invited_by_user
    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['invited_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key para accepted_by_user
    await queryRunner.createForeignKey(
      'invitation_tokens',
      new TableForeignKey({
        columnNames: ['accepted_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Índice para búsqueda por token
    await queryRunner.query(`
      CREATE INDEX idx_invitation_tokens_token ON invitation_tokens(token);
    `);

    // Índice para búsqueda por email y account
    await queryRunner.query(`
      CREATE INDEX idx_invitation_tokens_email_account ON invitation_tokens(email, account_id);
    `);

    // Índice para búsqueda por status
    await queryRunner.query(`
      CREATE INDEX idx_invitation_tokens_status ON invitation_tokens(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invitation_tokens_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invitation_tokens_email_account;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invitation_tokens_token;`);

    // Eliminar foreign keys
    const table = await queryRunner.getTable('invitation_tokens');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('invitation_tokens', foreignKey);
      }
    }

    // Eliminar tabla
    await queryRunner.dropTable('invitation_tokens');
  }
}
