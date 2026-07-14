import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
  ConflictException,
} from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number; email: string; username?: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() RegisterDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(RegisterDto);

    // Set HTTP-only cookie with the JWT token (same as login)
    this.setAccessTokenCookie(res, result.data.accessToken);

    // Return response without token in body (it's in the secure cookie)
    const includeTokenInResponse = process.env.NODE_ENV !== 'production';
    return res.status(201).json({
      message: result.message,
      data: {
        user: result.data.user,
        ...(includeTokenInResponse && { accessToken: result.data.accessToken }),
      },
    });
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
    this.setAccessTokenCookie(res, result.data.accessToken);

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

  @Get('google')
  async startGoogleLogin(@Res() res: Response) {
    const result = await this.authService.startGoogleLogin();
    return res.redirect(result.authorizationUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error || !code || !state) {
      return res.redirect(
        this.buildFrontendRedirect('/login', 'google_failed'),
      );
    }

    try {
      const result = await this.authService.handleGoogleCallback({
        code,
        state,
      });
      this.setAccessTokenCookie(res, result.accessToken);
      return res.redirect(this.buildFrontendRedirect(result.redirectPath));
    } catch (error) {
      const authError =
        error instanceof ConflictException
          ? 'google_email_conflict'
          : 'google_failed';
      return res.redirect(this.buildFrontendRedirect('/login', authError));
    }
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
    res.clearCookie('accessToken', this.getAccessTokenCookieOptions());

    return res.json({
      message: 'Logout successful',
    });
  }

  private setAccessTokenCookie(res: Response, accessToken: string): void {
    res.cookie('accessToken', accessToken, {
      ...this.getAccessTokenCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  private getAccessTokenCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite = this.getCookieSameSite(isProduction);

    return {
      httpOnly: true,
      secure: isProduction || sameSite === 'none',
      sameSite,
      path: '/',
    };
  }

  private getCookieSameSite(isProduction: boolean): CookieOptions['sameSite'] {
    const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();

    if (
      configuredSameSite === 'lax' ||
      configuredSameSite === 'strict' ||
      configuredSameSite === 'none'
    ) {
      return configuredSameSite;
    }

    return isProduction ? 'none' : 'lax';
  }

  private buildFrontendRedirect(path: string, authError?: string): string {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const redirectUrl = new URL(path, frontendUrl);
    if (authError) {
      redirectUrl.searchParams.set('authError', authError);
    }
    return redirectUrl.toString();
  }
}
