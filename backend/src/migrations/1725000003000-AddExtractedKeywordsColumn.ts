import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExtractedKeywordsColumn1725000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'extractedKeywords',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('analyses', 'extractedKeywords');
  }
}
