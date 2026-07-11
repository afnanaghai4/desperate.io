import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordCredential } from '../entities/password-credential.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordCredential)
    private readonly passwordCredentialsRepository: Repository<PasswordCredential>,
    private readonly dataSource: DataSource,
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
}
