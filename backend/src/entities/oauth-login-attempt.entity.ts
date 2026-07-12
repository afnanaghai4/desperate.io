import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('oauth_login_attempts')
export class OAuthLoginAttempt {
  @PrimaryGeneratedColumn()
  attemptId: number;

  @Column({ type: 'varchar' })
  @Index('IDX_oauth_login_attempts_stateHash', { unique: true })
  stateHash: string;

  @Column({ type: 'varchar' })
  nonce: string;

  @Column({ type: 'varchar' })
  codeVerifier: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
