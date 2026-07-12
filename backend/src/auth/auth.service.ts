import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordCredential } from '../entities/password-credential.entity';
import { User } from '../entities/user.entity';
import { AuthAccount } from '../entities/auth-account.entity';
import { OAuthLoginAttempt } from '../entities/oauth-login-attempt.entity';
import {
  GoogleOAuthService,
  VerifiedGoogleIdentity,
} from './google-oauth.service';

interface GoogleLoginResult {
  accessToken: string;
  user: {
    id: number;
    email: string;
  };
  redirectPath: string;
}

@Injectable()
export class AuthService {
  private readonly googleProvider = 'google';
  private readonly oauthAttemptTtlMs = 10 * 60 * 1000;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordCredential)
    private readonly passwordCredentialsRepository: Repository<PasswordCredential>,
    @InjectRepository(AuthAccount)
    private readonly authAccountsRepository: Repository<AuthAccount>,
    @InjectRepository(OAuthLoginAttempt)
    private readonly oauthLoginAttemptsRepository: Repository<OAuthLoginAttempt>,
    private readonly dataSource: DataSource,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  // implementation of registration of a new user
  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    const existingUser = await this.usersService.findbyEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.dataSource.transaction(async (manager) => {
      const createdUser = await manager.save(
        User,
        manager.create(User, {
          username,
          email,
        }),
      );
      await manager.save(
        PasswordCredential,
        manager.create(PasswordCredential, {
          userId: createdUser.userId,
          passwordHash,
        }),
      );
      return createdUser;
    });

    // Generate JWT token for auto-login after signup
    const payload = {
      sub: user.userId,
      email: user.email,
      username: user.username,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'User registered successfully',
      data: {
        accessToken,
        user: {
          id: user.userId,
          email: user.email,
        },
      },
    };
  }

  // implementation of login of an existing user

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findbyEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordCredential = await this.passwordCredentialsRepository.findOne(
      {
        where: { userId: user.userId },
        select: {
          credentialId: true,
          userId: true,
          passwordHash: true,
        },
      },
    );
    if (!passwordCredential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      passwordCredential.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.userId,
          email: user.email,
        },
      },
    };
  }

  async startGoogleLogin(): Promise<{ authorizationUrl: string }> {
    const state = this.generateRandomValue();
    const nonce = this.generateRandomValue();
    const codeVerifier = this.generateRandomValue(64);
    const codeChallenge = this.toBase64Url(
      createHash('sha256').update(codeVerifier).digest(),
    );

    await this.oauthLoginAttemptsRepository.save(
      this.oauthLoginAttemptsRepository.create({
        stateHash: this.hashValue(state),
        nonce,
        codeVerifier,
        expiresAt: new Date(Date.now() + this.oauthAttemptTtlMs),
        usedAt: null,
      }),
    );

    return {
      authorizationUrl: this.googleOAuthService.getAuthorizationUrl({
        state,
        nonce,
        codeChallenge,
      }),
    };
  }

  async handleGoogleCallback(params: {
    code: string;
    state: string;
  }): Promise<GoogleLoginResult> {
    const attempt = await this.consumeOAuthAttempt(params.state);
    const idToken = await this.googleOAuthService.exchangeCodeForIdToken({
      code: params.code,
      codeVerifier: attempt.codeVerifier,
    });
    const googleIdentity = await this.googleOAuthService.verifyIdToken(idToken);

    this.assertValidGoogleIdentity(googleIdentity, attempt.nonce);

    const existingAuthAccount = await this.authAccountsRepository.findOne({
      where: {
        provider: this.googleProvider,
        providerUserId: googleIdentity.sub,
      },
      relations: {
        user: true,
      },
    });

    if (existingAuthAccount) {
      const user = existingAuthAccount.user;
      return {
        accessToken: await this.signAccessToken(user),
        user: {
          id: user.userId,
          email: user.email,
        },
        redirectPath: user.profileDetails ? '/dashboard' : '/profile/setup',
      };
    }

    const existingUser = await this.usersService.findbyEmail(
      googleIdentity.email,
    );
    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Sign in with email and password first.',
      );
    }

    const username = await this.generateGoogleUsername(googleIdentity.email);
    const user = await this.dataSource.transaction(async (manager) => {
      const createdUser = await manager.save(
        User,
        manager.create(User, {
          username,
          email: googleIdentity.email,
        }),
      );

      await manager.save(
        AuthAccount,
        manager.create(AuthAccount, {
          userId: createdUser.userId,
          provider: this.googleProvider,
          providerUserId: googleIdentity.sub,
          providerEmail: googleIdentity.email,
        }),
      );

      return createdUser;
    });

    return {
      accessToken: await this.signAccessToken(user),
      user: {
        id: user.userId,
        email: user.email,
      },
      redirectPath: '/profile/setup',
    };
  }

  private async consumeOAuthAttempt(state: string): Promise<OAuthLoginAttempt> {
    const attempt = await this.oauthLoginAttemptsRepository.findOne({
      where: { stateHash: this.hashValue(state) },
    });

    if (
      !attempt ||
      attempt.usedAt ||
      attempt.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired Google sign-in state');
    }

    attempt.usedAt = new Date();
    return this.oauthLoginAttemptsRepository.save(attempt);
  }

  private assertValidGoogleIdentity(
    googleIdentity: VerifiedGoogleIdentity,
    expectedNonce: string,
  ): void {
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];

    if (!googleIdentity.sub || !googleIdentity.email) {
      throw new UnauthorizedException('Invalid Google identity');
    }

    if (!googleIdentity.emailVerified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    if (googleIdentity.nonce !== expectedNonce) {
      throw new UnauthorizedException('Invalid Google sign-in nonce');
    }

    if (
      !googleIdentity.issuer ||
      !validIssuers.includes(googleIdentity.issuer)
    ) {
      throw new UnauthorizedException('Invalid Google token issuer');
    }
  }

  private async generateGoogleUsername(email: string): Promise<string> {
    const localPart = email.split('@')[0] ?? 'google-user';
    const baseUsername = localPart
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const base = baseUsername.length >= 3 ? baseUsername : 'google-user';

    for (let index = 0; index < 10; index += 1) {
      const candidate = index === 0 ? base : `${base}-${index + 1}`;
      const existing = await this.usersService.findByUsername(candidate);
      if (!existing) {
        return candidate;
      }
    }

    return `${base}-${this.generateRandomValue(8)}`;
  }

  private async signAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
      username: user.username,
    });
  }

  private generateRandomValue(size = 32): string {
    return this.toBase64Url(randomBytes(size));
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private toBase64Url(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
}
