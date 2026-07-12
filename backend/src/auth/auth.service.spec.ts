import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordCredential } from '../entities/password-credential.entity';
import { AuthAccount } from '../entities/auth-account.entity';
import { OAuthLoginAttempt } from '../entities/oauth-login-attempt.entity';
import { GoogleOAuthService } from './google-oauth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    findbyEmail: jest.Mock;
    findByUsername: jest.Mock;
    CreateUser: jest.Mock;
  };
  let passwordCredentialsRepository: Partial<
    Record<keyof Repository<PasswordCredential>, jest.Mock>
  >;
  let authAccountsRepository: Partial<
    Record<keyof Repository<AuthAccount>, jest.Mock>
  >;
  let oauthLoginAttemptsRepository: Partial<
    Record<keyof Repository<OAuthLoginAttempt>, jest.Mock>
  >;
  let dataSource: {
    transaction: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let googleOAuthService: {
    getAuthorizationUrl: jest.Mock;
    exchangeCodeForIdToken: jest.Mock;
    verifyIdToken: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findbyEmail: jest.fn(),
      findByUsername: jest.fn(),
      CreateUser: jest.fn(),
    };

    passwordCredentialsRepository = {
      findOne: jest.fn(),
    };

    authAccountsRepository = {
      findOne: jest.fn(),
    };

    oauthLoginAttemptsRepository = {
      create: jest.fn((attempt: Partial<OAuthLoginAttempt>) => attempt),
      save: jest.fn(
        (attempt: Partial<OAuthLoginAttempt>) =>
          ({
            attemptId: 1,
            ...attempt,
          }) as OAuthLoginAttempt,
      ),
      findOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    googleOAuthService = {
      getAuthorizationUrl: jest.fn(),
      exchangeCodeForIdToken: jest.fn(),
      verifyIdToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: getRepositoryToken(PasswordCredential),
          useValue: passwordCredentialsRepository,
        },
        {
          provide: getRepositoryToken(AuthAccount),
          useValue: authAccountsRepository,
        },
        {
          provide: getRepositoryToken(OAuthLoginAttempt),
          useValue: oauthLoginAttemptsRepository,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
        { provide: GoogleOAuthService, useValue: googleOAuthService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user', async () => {
    usersService.findbyEmail.mockResolvedValue(null);
    usersService.findByUsername.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    const createdUser = {
      userId: 1,
      email: 'test@example.com',
      username: 'Test User',
    };
    const manager = {
      create: jest
        .fn()
        .mockReturnValueOnce({
          username: 'Test User',
          email: 'test@example.com',
        })
        .mockReturnValueOnce({
          userId: 1,
          passwordHash: 'hashed-password',
        }),
      save: jest.fn().mockResolvedValueOnce(createdUser).mockResolvedValueOnce({
        credentialId: 1,
        userId: 1,
        passwordHash: 'hashed-password',
      }),
    };
    dataSource.transaction.mockImplementation(
      async (callback: (transactionManager: typeof manager) => Promise<void>) =>
        callback(manager),
    );

    const result = await authService.register({
      email: 'test@example.com',
      password: 'plain-password',
      username: 'Test User',
    });

    expect(usersService.findbyEmail).toHaveBeenCalledWith('test@example.com');
    expect(usersService.findByUsername).toHaveBeenCalledWith('Test User');
    expect(bcrypt.hash).toHaveBeenCalledWith(
      'plain-password',
      expect.any(Number),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(manager.create).toHaveBeenCalledWith(expect.any(Function), {
      username: 'Test User',
      email: 'test@example.com',
    });
    expect(manager.create).toHaveBeenCalledWith(expect.any(Function), {
      userId: 1,
      passwordHash: 'hashed-password',
    });
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(result.data.user.email).toBe('test@example.com');
  });

  it('throws if email already exists during register', async () => {
    usersService.findbyEmail.mockResolvedValue({
      userId: 1,
      email: 'test@example.com',
    });

    await expect(
      authService.register({
        email: 'test@example.com',
        password: 'plain-password',
        username: 'Test User',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    usersService.findbyEmail.mockResolvedValue({
      userId: 1,
      email: 'test@example.com',
      username: 'Test User',
    });
    passwordCredentialsRepository.findOne?.mockResolvedValue({
      credentialId: 1,
      userId: 1,
      passwordHash: 'hashed-password',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('mock-jwt-token');

    const result = await authService.login({
      email: 'test@example.com',
      password: 'plain-password',
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      'plain-password',
      'hashed-password',
    );
    expect(jwtService.signAsync).toHaveBeenCalled();
    expect(result.data.user.email).toBe('test@example.com');
  });

  it('throws on wrong password during login', async () => {
    usersService.findbyEmail.mockResolvedValue({
      userId: 1,
      email: 'test@example.com',
      username: 'Test User',
    });
    passwordCredentialsRepository.findOne?.mockResolvedValue({
      credentialId: 1,
      userId: 1,
      passwordHash: 'hashed-password',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws if password credentials are missing during login', async () => {
    usersService.findbyEmail.mockResolvedValue({
      userId: 1,
      email: 'test@example.com',
      username: 'Test User',
    });
    passwordCredentialsRepository.findOne?.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'plain-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('throws if user not found during login', async () => {
    usersService.findbyEmail.mockResolvedValue(null);
    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'plain-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('starts a Google login with a stored OAuth attempt', async () => {
    googleOAuthService.getAuthorizationUrl.mockReturnValue(
      'https://accounts.google.com/oauth',
    );
    const anyString = expect.any(String) as unknown as string;
    const anyDate = expect.any(Date) as unknown as Date;

    const result = await authService.startGoogleLogin();

    expect(oauthLoginAttemptsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stateHash: anyString,
        nonce: anyString,
        codeVerifier: anyString,
        expiresAt: anyDate,
        usedAt: null,
      }),
    );
    expect(oauthLoginAttemptsRepository.delete).toHaveBeenCalled();
    expect(oauthLoginAttemptsRepository.save).toHaveBeenCalled();
    expect(googleOAuthService.getAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        state: anyString,
        nonce: anyString,
        codeChallenge: anyString,
      }),
    );
    expect(result.authorizationUrl).toBe('https://accounts.google.com/oauth');
  });

  it('logs in an existing linked Google user', async () => {
    const attempt = {
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    };
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue(attempt);
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'google@example.com',
      emailVerified: true,
      nonce: 'nonce',
      issuer: 'https://accounts.google.com',
    });
    authAccountsRepository.findOne?.mockResolvedValue({
      accountId: 1,
      provider: 'google',
      providerUserId: 'google-sub',
      providerEmail: 'google@example.com',
      userId: 7,
      user: {
        userId: 7,
        email: 'google@example.com',
        username: 'google-user',
        profileDetails: { personalInfo: {} },
      },
    });
    jwtService.signAsync.mockResolvedValue('google-jwt');

    const result = await authService.handleGoogleCallback({
      code: 'code',
      state: 'state',
    });

    expect(oauthLoginAttemptsRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stateHash: expect.any(String) as unknown as string,
        usedAt: expect.any(Object) as unknown as object,
        expiresAt: expect.any(Object) as unknown as object,
      }),
      { usedAt: expect.any(Date) as unknown as Date },
    );
    expect(googleOAuthService.exchangeCodeForIdToken).toHaveBeenCalledWith({
      code: 'code',
      codeVerifier: 'verifier',
    });
    expect(result.accessToken).toBe('google-jwt');
    expect(result.redirectPath).toBe('/dashboard');
  });

  it('creates a local user and auth account for a new verified Google user', async () => {
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'new.google@example.com',
      emailVerified: true,
      nonce: 'nonce',
      issuer: 'accounts.google.com',
    });
    authAccountsRepository.findOne?.mockResolvedValue(null);
    usersService.findbyEmail.mockResolvedValue(null);
    usersService.findByUsername.mockResolvedValue(null);
    const createdUser = {
      userId: 8,
      email: 'new.google@example.com',
      username: 'new-google',
    };
    const manager = {
      create: jest
        .fn()
        .mockReturnValueOnce({
          username: 'new-google',
          email: 'new.google@example.com',
        })
        .mockReturnValueOnce({
          userId: 8,
          provider: 'google',
          providerUserId: 'google-sub',
          providerEmail: 'new.google@example.com',
        }),
      save: jest.fn().mockResolvedValueOnce(createdUser).mockResolvedValueOnce({
        accountId: 1,
        userId: 8,
        provider: 'google',
      }),
    };
    dataSource.transaction.mockImplementation(
      async (callback: (transactionManager: typeof manager) => Promise<void>) =>
        callback(manager),
    );
    jwtService.signAsync.mockResolvedValue('new-google-jwt');

    const result = await authService.handleGoogleCallback({
      code: 'code',
      state: 'state',
    });

    expect(usersService.findbyEmail).toHaveBeenCalledWith(
      'new.google@example.com',
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(manager.create).toHaveBeenCalledWith(expect.any(Function), {
      username: 'new-google',
      email: 'new.google@example.com',
    });
    expect(manager.create).toHaveBeenCalledWith(expect.any(Function), {
      userId: 8,
      provider: 'google',
      providerUserId: 'google-sub',
      providerEmail: 'new.google@example.com',
    });
    expect(result.accessToken).toBe('new-google-jwt');
    expect(result.redirectPath).toBe('/profile/setup');
  });

  it('rejects Google login when the email already belongs to a password account', async () => {
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'existing@example.com',
      emailVerified: true,
      nonce: 'nonce',
      issuer: 'accounts.google.com',
    });
    authAccountsRepository.findOne?.mockResolvedValue(null);
    usersService.findbyEmail.mockResolvedValue({
      userId: 3,
      email: 'existing@example.com',
      username: 'existing',
    });

    await expect(
      authService.handleGoogleCallback({ code: 'code', state: 'state' }),
    ).rejects.toThrow(ConflictException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects Google login with an unverified email', async () => {
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'unverified@example.com',
      emailVerified: false,
      nonce: 'nonce',
      issuer: 'accounts.google.com',
    });

    await expect(
      authService.handleGoogleCallback({ code: 'code', state: 'state' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects Google login with a nonce mismatch', async () => {
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'expected-nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'verified@example.com',
      emailVerified: true,
      nonce: 'different-nonce',
      issuer: 'accounts.google.com',
    });

    await expect(
      authService.handleGoogleCallback({ code: 'code', state: 'state' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects Google login with an expired or replayed state', async () => {
    oauthLoginAttemptsRepository.update?.mockResolvedValue({ affected: 0 });
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() - 60_000),
      usedAt: null,
      createdAt: new Date(),
    });

    await expect(
      authService.handleGoogleCallback({ code: 'code', state: 'state' }),
    ).rejects.toThrow(BadRequestException);
    expect(oauthLoginAttemptsRepository.findOne).not.toHaveBeenCalled();
    expect(googleOAuthService.exchangeCodeForIdToken).not.toHaveBeenCalled();
  });

  it('rejects Google login with an invalid issuer', async () => {
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    });
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub',
      email: 'verified@example.com',
      emailVerified: true,
      nonce: 'nonce',
      issuer: 'https://not-google.example.com',
    });

    await expect(
      authService.handleGoogleCallback({ code: 'code', state: 'state' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects Google login with missing identity claims', async () => {
    oauthLoginAttemptsRepository.findOne?.mockResolvedValue({
      attemptId: 1,
      stateHash: 'hash',
      nonce: 'nonce',
      codeVerifier: 'verifier',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    });
    googleOAuthService.exchangeCodeForIdToken.mockResolvedValue('id-token');
    googleOAuthService.verifyIdToken.mockResolvedValue({
      sub: '',
      email: '',
      emailVerified: true,
      nonce: 'nonce',
      issuer: 'https://accounts.google.com',
    });

    await expect(
      authService.handleGoogleCallback({ code: 'code', state: 'state' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
