import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('auth_accounts')
@Index(
  'IDX_auth_accounts_provider_providerUserId',
  ['provider', 'providerUserId'],
  { unique: true },
)
export class AuthAccount {
  @PrimaryGeneratedColumn()
  accountId: number;

  @Column({ type: 'integer' })
  @Index('IDX_auth_accounts_userId')
  userId: number;

  @Column({ type: 'varchar' })
  provider: string;

  @Column({ type: 'varchar' })
  providerUserId: string;

  @Column({ type: 'varchar' })
  providerEmail: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.authAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
