import { Response } from 'express';
import { ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let originalNodeEnv: string | undefined;
  let originalCookieSameSite: string | undefined;
  let authService: {
    login: jest.Mock;
    startGoogleLogin: jest.Mock;
    handleGoogleCallback: jest.Mock;
  };
  let response: Partial<Record<keyof Response, jest.Mock>>;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalCookieSameSite = process.env.COOKIE_SAME_SITE;
    process.env.FRONTEND_URL = 'http://localhost:3000';
    authService = {
      login: jest.fn(),
      startGoogleLogin: jest.fn(),
      handleGoogleCallback: jest.fn(),
    };
    response = {
      redirect: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      json: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalCookieSameSite === undefined) {
      delete process.env.COOKIE_SAME_SITE;
    } else {
      process.env.COOKIE_SAME_SITE = originalCookieSameSite;
    }
    delete process.env.FRONTEND_URL;
    jest.clearAllMocks();
  });

  it('redirects to Google when starting Google login', async () => {
    authService.startGoogleLogin.mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/oauth',
    });

    await controller.startGoogleLogin(response as unknown as Response);

    expect(response.redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/oauth',
    );
  });

  it('sets the access token cookie and redirects after Google callback', async () => {
    authService.handleGoogleCallback.mockResolvedValue({
      accessToken: 'google-jwt',
      user: {
        id: 1,
        email: 'google@example.com',
      },
      redirectPath: '/profile/setup',
    });

    await controller.googleCallback(
      'code',
      'state',
      undefined,
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'accessToken',
      'google-jwt',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/profile/setup',
    );
  });

  it('redirects to login when Google callback has an error', async () => {
    await controller.googleCallback(
      undefined,
      'state',
      'access_denied',
      response as unknown as Response,
    );

    expect(authService.handleGoogleCallback).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?authError=google_failed',
    );
  });

  it('redirects to login when Google callback handling fails', async () => {
    authService.handleGoogleCallback.mockRejectedValue(new Error('failed'));

    await controller.googleCallback(
      'code',
      'state',
      undefined,
      response as unknown as Response,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?authError=google_failed',
    );
  });

  it('redirects to a distinct error when Google email conflicts with an existing account', async () => {
    authService.handleGoogleCallback.mockRejectedValue(
      new ConflictException('account exists'),
    );

    await controller.googleCallback(
      'code',
      'state',
      undefined,
      response as unknown as Response,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?authError=google_email_conflict',
    );
  });

  it('clears the access token cookie with matching auth cookie options', () => {
    controller.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    );
    expect(response.json).toHaveBeenCalledWith({
      message: 'Logout successful',
    });
  });

  it('uses secure SameSite=None auth cookies in production by default', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SAME_SITE;

    controller.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
      }),
    );
  });

  it('sets secure SameSite=None auth cookies during production login', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SAME_SITE;
    authService.login.mockResolvedValue({
      data: {
        accessToken: 'login-jwt',
        user: {
          id: 1,
          email: 'user@example.com',
        },
      },
    });

    await controller.login(
      { email: 'user@example.com', password: 'Password123!' },
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'accessToken',
      'login-jwt',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
      }),
    );
    expect(response.json).toHaveBeenCalledWith({
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          email: 'user@example.com',
        },
      },
    });
  });

  it('allows overriding production auth cookie SameSite through env', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SAME_SITE = 'lax';

    controller.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        sameSite: 'lax',
        secure: true,
      }),
    );
  });

  it('forces secure cookies when SameSite=None is configured outside production', () => {
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_SAME_SITE = 'none';

    controller.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        sameSite: 'none',
        secure: true,
      }),
    );
  });
});
