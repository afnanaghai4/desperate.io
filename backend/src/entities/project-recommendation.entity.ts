import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Analysis } from './analysis.entity';
import { DifficultyLevel } from 'src/common/enums/difficulty-level.enum';

@Entity('project_recommendations')
export class ProjectRecommendation {
  @PrimaryGeneratedColumn()
  recommendationId: number;

  @Column()
  analysisId: number;

  @Column()
  Title: string;

  @Column({ type: 'text' })
  Description: string;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
  })
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
  analysis: Analysis;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
  })
  Difficulty: DifficultyLevel;
}
