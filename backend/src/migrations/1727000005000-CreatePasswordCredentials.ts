import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePasswordCredentials1727000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_credentials',
        columns: [
          {
            name: 'credentialId',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'passwordHash',
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
      'password_credentials',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['userId'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'password_credentials',
      new TableIndex({
        name: 'IDX_password_credentials_userId',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`
      INSERT INTO "password_credentials" ("userId", "passwordHash", "createdAt", "updatedAt")
      SELECT "userId", "passwordHash", now(), now()
      FROM "users"
      WHERE "passwordHash" IS NOT NULL
    `);

    await queryRunner.dropColumn('users', 'passwordHash');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "passwordHash" varchar
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "passwordHash" = "password_credentials"."passwordHash"
      FROM "password_credentials"
      WHERE "users"."userId" = "password_credentials"."userId"
    `);

    // This rollback assumes every user has a password credential. Once
    // passwordless providers exist, users without credentials will make this
    // NOT NULL restoration fail.
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "passwordHash" SET NOT NULL
    `);

    await queryRunner.dropTable('password_credentials');
  }
}
