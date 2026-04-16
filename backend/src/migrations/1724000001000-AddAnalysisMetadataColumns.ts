import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add job analysis metadata columns to the analyses table
 *
 * This migration adds six new columns to store extracted job metadata:
 * - roleDirection: The primary role category (Backend, Frontend, etc.)
 * - skills: Array of technical skills required
 * - tools: Array of tools/platforms used
 * - cloudPlatforms: Array of cloud providers
 * - databases: Array of database technologies
 * - frameworks: Array of frameworks used
 *
 * All JSONB columns are created with NOT NULL constraints and '[]'::jsonb defaults
 * to prevent null propagation and type violations in TypeScript consumers.
 */
export class AddAnalysisMetadataColumns1724000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'skills',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment: 'Array of technical skills extracted from job description',
      }),
    );

    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'tools',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment: 'Array of tools and platforms extracted from job description',
      }),
    );

    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'cloudPlatforms',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment: 'Array of cloud providers extracted from job description',
      }),
    );

    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'databases',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment:
          'Array of database technologies extracted from job description',
      }),
    );

    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'frameworks',
        type: 'jsonb',
        isNullable: false,
        default: `'[]'::jsonb`,
        comment: 'Array of frameworks extracted from job description',
      }),
    );

    await queryRunner.addColumn(
      'analyses',
      new TableColumn({
        name: 'roleDirection',
        type: 'varchar',
        isNullable: true,
        comment:
          'Primary role direction (Backend, Frontend, Full-stack, DevOps, etc.)',
      }),
    );

    // Backfill existing rows to ensure NOT NULL constraint compliance
    // Set all array columns to '[]'::jsonb WHERE they are NULL
    await queryRunner.query(
      `UPDATE "analyses" SET "skills" = '[]'::jsonb WHERE "skills" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "analyses" SET "tools" = '[]'::jsonb WHERE "tools" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "analyses" SET "cloudPlatforms" = '[]'::jsonb WHERE "cloudPlatforms" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "analyses" SET "databases" = '[]'::jsonb WHERE "databases" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "analyses" SET "frameworks" = '[]'::jsonb WHERE "frameworks" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('analyses', 'roleDirection');
    await queryRunner.dropColumn('analyses', 'frameworks');
    await queryRunner.dropColumn('analyses', 'databases');
    await queryRunner.dropColumn('analyses', 'cloudPlatforms');
    await queryRunner.dropColumn('analyses', 'tools');
    await queryRunner.dropColumn('analyses', 'skills');
  }
}
