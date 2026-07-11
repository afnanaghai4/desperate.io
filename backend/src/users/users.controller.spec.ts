import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findById: jest.Mock;
    updateUserProfile: jest.Mock;
    createProfile: jest.Mock;
  };

  const user: User = {
    userId: 1,
    username: 'profile-user',
    email: 'profile@example.com',
    profileDetails: {
      personalInfo: { fullName: 'Profile User' },
    },
    role: 'user' as User['role'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    jobs: [],
  };

  const request = {
    user: {
      userId: user.userId,
      email: user.email,
    },
  } as never;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      updateUserProfile: jest.fn(),
      createProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authenticated user profile without password hash', async () => {
    usersService.findById.mockResolvedValue(user);

    const result = await controller.getProfile(request);

    expect(usersService.findById).toHaveBeenCalledWith(user.userId);
    expect(result).toEqual({
      message: 'Profile retrieved successfully',
      data: {
        profileDetails: user.profileDetails,
        email: user.email,
        username: user.username,
      },
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('throws when the authenticated user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(controller.getProfile(request)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates the authenticated user profile and ignores body userId fields', async () => {
    const patch = {
      userId: 999,
      personalInfo: { fullName: 'Updated Profile User' },
    } as never;
    const updatedUser = {
      ...user,
      profileDetails: {
        personalInfo: { fullName: 'Updated Profile User' },
      },
    };
    usersService.updateUserProfile.mockResolvedValue(updatedUser);

    const result = await controller.updateProfile(request, patch);

    expect(usersService.updateUserProfile).toHaveBeenCalledWith(
      user.userId,
      patch,
    );
    expect(result).toEqual({
      message: 'Profile updated successfully',
      data: {
        profileDetails: updatedUser.profileDetails,
        email: updatedUser.email,
        username: updatedUser.username,
      },
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('creates a profile for the authenticated user', async () => {
    const profile = {
      personalInfo: { fullName: 'New Profile User' },
    };
    usersService.createProfile.mockResolvedValue({
      ...user,
      profileDetails: profile,
    });

    await controller.createProfile(request, profile);

    expect(usersService.createProfile).toHaveBeenCalledWith(
      user.userId,
      profile,
    );
  });
});
