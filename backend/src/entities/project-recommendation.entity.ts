import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Analysis } from './analysis.entity';
import { DifficultyLevel } from 'src/common/enums/difficulty-level.enum';

export interface Milestone {
  week: string;
  tasks: string[];
  deliverable: string;
}

@Entity('project_recommendations')
export class ProjectRecommendation {
  @PrimaryGeneratedColumn()
  recommendationId: number;

  @Column({ type: 'integer' })
  analysisId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    enum: DifficultyLevel as Record<string, string>,
  })
  difficultyLevel: DifficultyLevel;

  @Column({ type: 'varchar' })
  timeline: string;

  @Column({ type: 'jsonb', default: [] })
  techStack: string[];

  @Column({ type: 'jsonb', default: [] })
  skills: string[];

  @Column({ type: 'jsonb', default: [] })
  milestones: Milestone[];

  @Column({ type: 'jsonb', default: [] })
  cvPoints: string[];

  @Column({ type: 'float' })
  improvedInterviewChancePercent: number;

  @Column({ type: 'integer' })
  displayOrder: number;

  @ManyToOne(() => Analysis, (analysis) => analysis.projectRecommendations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;
}
