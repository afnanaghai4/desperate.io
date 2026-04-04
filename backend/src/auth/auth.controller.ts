import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
  Request,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() RegisterDto: RegisterDto) {
    return this.authService.register(RegisterDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() LoginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(LoginDto);

    // Set HTTP-only cookie with the JWT token
    // httpOnly: true → JavaScript cannot access this cookie (protects from XSS)
    // secure: true → Cookie only sent over HTTPS (set based on environment for localhost dev)
    // sameSite: 'lax' → Cookie sent in same-site requests and top-level navigations
    // path: '/' → Cookie sent with all requests
    // maxAge: 24 hours expiry
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: isProduction, // Allow localhost in dev/test, require HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax', // Use 'lax' for dev/test to allow supertest
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Don't send the token in the response body anymore
    // It's now in the HTTP-only cookie (secure)
    // However, return it for testing/dev purposes only (test environment can use it)
    const includeTokenInResponse = process.env.NODE_ENV !== 'production';
    return res.json({
      message: 'Login successful',
      data: {
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
        },
        ...(includeTokenInResponse && { accessToken: result.data.accessToken }),
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: AuthRequest) {
    return {
      message: 'Protected route accessed successfully',
      data: req.user,
    };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    // Clear the HTTP-only cookie by setting Max-Age=0
    // This tells the browser to delete the cookie
    res.clearCookie('accessToken', {
      path: '/',
    });

    return res.json({
      message: 'Logout successful',
    });
  }
}
