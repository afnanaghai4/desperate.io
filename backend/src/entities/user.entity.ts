import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
<<<<<<< Updated upstream
  id: number;
=======
  userId: number;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
>>>>>>> Stashed changes

  @Column({ type: 'varchar', unique: true })
  email: string;

<<<<<<< Updated upstream
  @Column()
  name: string;
=======
  @Column({ type: 'jsonb', nullable: true })
  profileDetails: Record<string, any> | null;

  @Column({ type: 'varchar', select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Job, (job) => job.user)
  jobs: Job[];
>>>>>>> Stashed changes
}
