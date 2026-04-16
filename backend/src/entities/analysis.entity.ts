import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { ProjectRecommendation } from './project-recommendation.entity';

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn()
  analysisId: number;

  @Column({ type: 'integer', unique: true })
  jobId: number;

  @Column({ type: 'varchar' })
  jobTitle: string;

  @Column({ type: 'varchar', nullable: true })
  companyName: string | null;

  @Column({ type: 'jsonb', default: [] })
  strongPoints: string[];

  @Column({ type: 'jsonb', default: [] })
  weakPoints: string[];

  @Column({ type: 'varchar', nullable: true })
  roleDirection: string | null;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  tools: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  cloudPlatforms: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  databases: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  frameworks: string[];

  @Column({ type: 'float' })
  baselineInterviewChancePercent: number;

  @Column({ type: 'varchar', nullable: true })
  seniority: string | null;

  @Column({ type: 'varchar', nullable: true })
  domain: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Job, (job) => job.analysis, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @OneToMany(
    () => ProjectRecommendation,
    (projectRecommendation) => projectRecommendation.analysis,
    {
      cascade: true,
    },
  )
  projectRecommendations: ProjectRecommendation[];
}
