import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

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

  async CreateUser(user: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create({
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
    });
    return this.usersRepository.save(newUser);
  }
}
