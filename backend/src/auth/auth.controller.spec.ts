import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    startGoogleLogin: jest.Mock;
    handleGoogleCallback: jest.Mock;
  };
  let response: Partial<Record<keyof Response, jest.Mock>>;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    authService = {
      startGoogleLogin: jest.fn(),
      handleGoogleCallback: jest.fn(),
    };
    response = {
      redirect: jest.fn(),
      cookie: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  afterEach(() => {
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
});
