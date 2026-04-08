import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { ProfileDetailsDto } from './dto/update-user-profile.dto';

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
    profileDetails: ProfileDetailsDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.profileDetails = { ...user.profileDetails, ...profileDetails };
    return this.usersRepository.save(user);
  }
}
