import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add fullResponse column to analyses table
 *
 * This migration adds a new column to store the complete JobAnalysisResponse
 * object returned from the AI orchestrator. This allows us to persist and
 * retrieve the full analysis data including all analysis details.
 *
 * The fullResponse column is nullable to support existing records that may
 * not have gone through the analysis flow yet.
 */
export class AddFullResponseColumn1724000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'fullResponse',
        type: 'jsonb',
        isNullable: true,
        comment: 'Complete JobAnalysisResponse object from AI orchestrator',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('analyses', 'fullResponse');
  }
}
