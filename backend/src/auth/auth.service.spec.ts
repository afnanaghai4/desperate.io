import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordCredential } from '../entities/password-credential.entity';

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
  let dataSource: {
    transaction: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
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

    dataSource = {
      transaction: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: getRepositoryToken(PasswordCredential),
          useValue: passwordCredentialsRepository,
        },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
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
});
