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

  @Column()
  analysisId: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
  })
  difficultyLevel: DifficultyLevel;

  @Column()
  timeline: string;

  @Column({ type: 'jsonb', default: [] })
  techStack: string[];

  @Column({ type: 'float' })
  improvedInterviewChancePercent: number;

  @Column()
  displayOrder: number;

  @ManyToOne(() => Analysis, (analysis) => analysis.projectRecommendations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;
}
