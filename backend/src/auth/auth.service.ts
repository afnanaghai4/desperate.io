import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // implementation of registration of a new user
  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    const existingUser = await this.usersService.findbyEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.CreateUser({
      username,
      passwordHash,
      email,
    });

    return {
      message: 'User registered successfully',
      data: {
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      email: user.email,
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
