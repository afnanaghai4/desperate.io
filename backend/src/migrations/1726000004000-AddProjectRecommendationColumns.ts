import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add missing columns to project_recommendations table
 *
 * This migration adds four new JSONB columns to support storing the complete
 * ProjectRecommendationResponse from the AI orchestrator:
 * - skills: Array of skills required for the project
 * - milestones: Array of milestone objects with tasks and deliverables
 * - cvPoints: Array of CV points to highlight on a resume
 *
 * These columns are necessary for the proper mapping between the AI service
 * response and the database entity.
 */
export class AddProjectRecommendationColumns1726000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'project_recommendations',
      new TableColumn({
        name: 'skills',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment: 'Array of technical skills required for the project',
      }),
    );

    await queryRunner.addColumn(
      'project_recommendations',
      new TableColumn({
        name: 'milestones',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment:
          'Array of milestone objects containing week, tasks, and deliverable',
      }),
    );

    await queryRunner.addColumn(
      'project_recommendations',
      new TableColumn({
        name: 'cvPoints',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment:
          'Array of CV points that can be highlighted when presenting this project',
      }),
    );

    // Backfill existing rows to ensure NOT NULL constraint compliance
    await queryRunner.query(
      `UPDATE "project_recommendations" SET "skills" = '[]'::jsonb WHERE "skills" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "project_recommendations" SET "milestones" = '[]'::jsonb WHERE "milestones" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "project_recommendations" SET "cvPoints" = '[]'::jsonb WHERE "cvPoints" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('project_recommendations', 'cvPoints');
    await queryRunner.dropColumn('project_recommendations', 'milestones');
    await queryRunner.dropColumn('project_recommendations', 'skills');
  }
}
