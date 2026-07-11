import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Job } from './job.entity';
import { PasswordCredential } from './password-credential.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  profileDetails: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Job, (job) => job.user)
  jobs: Job[];

  @OneToOne(
    () => PasswordCredential,
    (passwordCredential) => passwordCredential.user,
  )
  passwordCredential?: PasswordCredential;
}
