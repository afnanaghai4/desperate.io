import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAuthAccountsAndOAuthAttempts1728000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_accounts',
        columns: [
          {
            name: 'accountId',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'providerUserId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'providerEmail',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'auth_accounts',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['userId'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'auth_accounts',
      new TableIndex({
        name: 'IDX_auth_accounts_provider_providerUserId',
        columnNames: ['provider', 'providerUserId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'auth_accounts',
      new TableIndex({
        name: 'IDX_auth_accounts_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'oauth_login_attempts',
        columns: [
          {
            name: 'attemptId',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'stateHash',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'nonce',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'codeVerifier',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'oauth_login_attempts',
      new TableIndex({
        name: 'IDX_oauth_login_attempts_stateHash',
        columnNames: ['stateHash'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('oauth_login_attempts');
    await queryRunner.dropTable('auth_accounts');
  }
}
