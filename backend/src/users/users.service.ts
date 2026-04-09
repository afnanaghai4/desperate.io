import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findbyEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: {
        userId: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
        profileDetails: true,
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { userId: id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async CreateUser(user: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create({
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
    });
    return this.usersRepository.save(newUser);
  }

  async updateUserProfile(
    userId: number,
    profileData: UpdateProfileDto,
  ): Promise<User> {
    // Atomic JSONB merge at database level
    // Handles both NULL (new profile) and existing profileDetails
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        profileDetails: () =>
          `CASE WHEN "profileDetails" IS NULL THEN :patch::jsonb ELSE "profileDetails" || :patch::jsonb END`,
      })
      .setParameter('patch', JSON.stringify(profileData))
      .where('userId = :userId', { userId })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    // Fetch and return updated user
    const updatedUser = await this.usersRepository.findOne({
      where: { userId },
    });
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    return updatedUser;
  }
}
