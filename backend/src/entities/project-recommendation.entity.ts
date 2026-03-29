import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Analysis } from './analysis.entity';
import { DifficultyLevel } from 'src/common/enums/difficulty-level.enum';

@Entity('project_recommendations')
export class ProjectRecommendation {
  @PrimaryGeneratedColumn()
  recommendationId: number;

  @Column({ type: 'int' })
  analysisId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
  })
  difficultyLevel: DifficultyLevel;

  @Column({ type: 'varchar' })
  timeline: string;

  @Column({ type: 'jsonb', default: [] })
  techStack: string[];

  @Column({ type: 'float' })
  improvedInterviewChancePercent: number;

  @Column({ type: 'int' })
  displayOrder: number;

  @ManyToOne(() => Analysis, (analysis) => analysis.projectRecommendations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;
}
