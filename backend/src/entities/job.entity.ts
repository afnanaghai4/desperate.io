import {
  Column,
  Check,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { InputType } from '../common/enums/input-type.enum';
import { User } from './user.entity';
import { Analysis } from './analysis.entity';

@Entity('jobs')
@Check(`(
  ("inputType" = 'TEXT' AND "jobText" IS NOT NULL AND "jobLink" IS NULL) OR
  ("inputType" = 'LINK' AND "jobLink" IS NOT NULL AND "jobText" IS NULL)
)`)
export class Job {
  @PrimaryGeneratedColumn()
  jobId: number;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: InputType,
  })
  inputType: InputType;

  @Column({ type: 'text', nullable: true })
  jobText: string | null;

  @Column({ nullable: true })
  jobLink: string | null;

  @Column({ nullable: true })
  companyName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Analysis, (analysis) => analysis.job)
  analysis: Analysis;
}
