import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-user-profile.dto';
import { CreateProfileDto } from './dto/create-user-profile.dto';
import { User } from '../entities/user.entity';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: AuthRequest) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'Profile retrieved successfully',
      data: {
        profileDetails: user.profileDetails,
        email: user.email,
        username: user.username,
      },
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: AuthRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateUserProfile(
      req.user.userId,
      updateProfileDto,
    );
    return {
      message: 'Profile updated successfully',
      data: {
        profileDetails: updatedUser.profileDetails,
        email: updatedUser.email,
        username: updatedUser.username,
      },
    };
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @Request() req: AuthRequest,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<{ message: string; data: User }> {
    const createProfile = await this.usersService.createProfile(
      req.user.userId,
      createProfileDto,
    );
    return {
      message: 'Profile created successfully',
      data: createProfile,
    };
  }
}
