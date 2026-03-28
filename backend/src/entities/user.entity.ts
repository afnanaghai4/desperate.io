import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Job } from './job.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true })
  username: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  profileDetails: Record<string, any> | null;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Job, (job) => job.user)
  jobs: Job[];
}
