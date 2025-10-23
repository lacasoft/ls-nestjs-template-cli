import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSoftDeleteToUsersAndInvitations1728677100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar deletedAt a users
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Agregar deletedAt a invitation_tokens
    await queryRunner.addColumn(
      'invitation_tokens',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Crear índice para consultas eficientes de usuarios no eliminados
    await queryRunner.query(`
      CREATE INDEX idx_users_deleted_at ON users(deleted_at);
    `);

    // Crear índice para consultas eficientes de invitaciones no eliminadas
    await queryRunner.query(`
      CREATE INDEX idx_invitation_tokens_deleted_at ON invitation_tokens(deleted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invitation_tokens_deleted_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_deleted_at;`);

    // Eliminar columnas
    await queryRunner.dropColumn('invitation_tokens', 'deleted_at');
    await queryRunner.dropColumn('users', 'deleted_at');
  }
}
