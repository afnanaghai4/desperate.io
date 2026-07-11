import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

type MockRepository<T extends object = object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
> & {
  createQueryBuilder: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    setParameter: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };

  const user: User = {
    userId: 1,
    username: 'test-user',
    email: 'test@example.com',
    profileDetails: null,
    role: 'user' as User['role'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    jobs: [],
  };

  beforeEach(async () => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('finds a user by email', async () => {
    repository.findOne?.mockResolvedValue(user);

    await expect(service.findbyEmail(user.email)).resolves.toBe(user);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: user.email },
    });
  });

  it('finds a user by id without explicitly selecting password hash', async () => {
    repository.findOne?.mockResolvedValue(user);

    await expect(service.findById(user.userId)).resolves.toBe(user);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { userId: user.userId },
    });
  });

  it('finds a user by username', async () => {
    repository.findOne?.mockResolvedValue(user);

    await expect(service.findByUsername(user.username)).resolves.toBe(user);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { username: user.username },
    });
  });

  it('creates and saves a user with expected fields', async () => {
    const createdUser = { ...user };
    repository.create?.mockReturnValue(createdUser);
    repository.save?.mockResolvedValue(createdUser);

    await expect(
      service.CreateUser({
        username: user.username,
        email: user.email,
        profileDetails: { ignored: true },
      }),
    ).resolves.toBe(createdUser);

    expect(repository.create).toHaveBeenCalledWith({
      username: user.username,
      email: user.email,
    });
    expect(repository.save).toHaveBeenCalledWith(createdUser);
  });

  it('creates a profile for an existing user', async () => {
    const profileDetails = {
      personalInfo: { fullName: 'Test User' },
      experiences: [{ currentPosition: 'Backend Engineer' }],
    };
    const userWithoutProfile = { ...user, profileDetails: null };
    const savedUser = { ...user, profileDetails };

    repository.findOne?.mockResolvedValue(userWithoutProfile);
    repository.save?.mockResolvedValue(savedUser);

    await expect(
      service.createProfile(user.userId, profileDetails),
    ).resolves.toBe(savedUser);

    expect(userWithoutProfile.profileDetails).toEqual(profileDetails);
    expect(repository.save).toHaveBeenCalledWith(userWithoutProfile);
  });

  it('throws when creating a profile for a missing user', async () => {
    repository.findOne?.mockResolvedValue(null);

    await expect(
      service.createProfile(user.userId, {
        personalInfo: { fullName: 'Missing User' },
      }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws when creating a profile that already exists', async () => {
    repository.findOne?.mockResolvedValue({
      ...user,
      profileDetails: { personalInfo: { fullName: 'Existing User' } },
    });

    await expect(
      service.createProfile(user.userId, {
        personalInfo: { fullName: 'Replacement User' },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates profile details with a JSONB patch and returns the updated user', async () => {
    const patch = {
      personalInfo: { fullName: 'Updated User' },
    };
    const updatedUser = {
      ...user,
      profileDetails: patch,
    };

    queryBuilder.execute.mockResolvedValue({ affected: 1 });
    repository.findOne?.mockResolvedValue(updatedUser);

    await expect(service.updateUserProfile(user.userId, patch)).resolves.toBe(
      updatedUser,
    );

    expect(repository.createQueryBuilder).toHaveBeenCalled();
    expect(queryBuilder.update).toHaveBeenCalledWith(User);
    expect(queryBuilder.set).toHaveBeenCalledWith({
      profileDetails: expect.any(Function) as () => string,
    });
    expect(queryBuilder.setParameter).toHaveBeenCalledWith(
      'patch',
      JSON.stringify(patch),
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('userId = :userId', {
      userId: user.userId,
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { userId: user.userId },
    });
  });

  it('throws when updating a missing user', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 0 });

    await expect(
      service.updateUserProfile(user.userId, {
        personalInfo: { fullName: 'Missing User' },
      }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('throws when updated user cannot be loaded after patching', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 1 });
    repository.findOne?.mockResolvedValue(null);

    await expect(
      service.updateUserProfile(user.userId, {
        personalInfo: { fullName: 'Missing After Update' },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
