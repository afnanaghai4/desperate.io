import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { GoogleOAuthService } from '../src/auth/google-oauth.service';
import { createTestRequest } from './helpers/test-request';

interface GoogleAuthUrlParams {
  state: string;
  nonce: string;
  codeChallenge: string;
}

describe('Google Auth (e2e)', () => {
  let app: INestApplication;
  let googleOAuthService: {
    getAuthorizationUrl: jest.Mock;
    exchangeCodeForIdToken: jest.Mock;
    verifyIdToken: jest.Mock;
  };

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    googleOAuthService = {
      getAuthorizationUrl: jest.fn(
        ({ state }: { state: string }) =>
          `https://accounts.google.test/oauth?state=${state}`,
      ),
      exchangeCodeForIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      verifyIdToken: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleOAuthService)
      .useValue(googleOAuthService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    delete process.env.FRONTEND_URL;
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function getLastGoogleAuthUrlParams(): GoogleAuthUrlParams {
    const calls = googleOAuthService.getAuthorizationUrl.mock.calls as [
      GoogleAuthUrlParams,
    ][];
    return calls[calls.length - 1][0];
  }

  function getRedirectState(response: Response): string {
    const state = new URL(response.headers.location).searchParams.get('state');
    expect(state).toBeTruthy();
    return state as string;
  }

  it('/auth/google (GET) redirects to Google with generated state', async () => {
    const response: Response = await createTestRequest(app)
      .get('/auth/google')
      .expect(302);
    const anyString = expect.any(String) as unknown as string;

    expect(response.headers.location).toContain(
      'https://accounts.google.test/oauth?state=',
    );
    expect(googleOAuthService.getAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        state: anyString,
        nonce: anyString,
        codeChallenge: anyString,
      }),
    );
  });

  it('/auth/google/callback (GET) creates a new Google user and sets auth cookie', async () => {
    const startResponse: Response = await createTestRequest(app)
      .get('/auth/google')
      .expect(302);
    const state = getRedirectState(startResponse);
    const anyString = expect.any(String) as unknown as string;

    const nonce = getLastGoogleAuthUrlParams().nonce;
    googleOAuthService.verifyIdToken.mockResolvedValueOnce({
      sub: `google-sub-${Date.now()}`,
      email: `google-${Date.now()}@example.com`,
      emailVerified: true,
      nonce,
      issuer: 'https://accounts.google.com',
    });

    const callbackResponse: Response = await createTestRequest(app)
      .get('/auth/google/callback')
      .query({ code: 'oauth-code', state })
      .expect(302);

    expect(callbackResponse.headers.location).toBe(
      'http://localhost:3000/profile/setup',
    );
    expect(callbackResponse.headers['set-cookie']?.[0]).toContain(
      'accessToken=',
    );
    expect(googleOAuthService.exchangeCodeForIdToken).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'oauth-code',
        codeVerifier: anyString,
      }),
    );
  });

  it('/auth/google/callback (GET) rejects replayed state', async () => {
    const startResponse: Response = await createTestRequest(app)
      .get('/auth/google')
      .expect(302);
    const state = getRedirectState(startResponse);
    const nonce = getLastGoogleAuthUrlParams().nonce;

    googleOAuthService.verifyIdToken.mockResolvedValueOnce({
      sub: `replay-sub-${Date.now()}`,
      email: `replay-${Date.now()}@example.com`,
      emailVerified: true,
      nonce,
      issuer: 'https://accounts.google.com',
    });

    await createTestRequest(app)
      .get('/auth/google/callback')
      .query({ code: 'oauth-code', state })
      .expect(302);

    const replayResponse: Response = await createTestRequest(app)
      .get('/auth/google/callback')
      .query({ code: 'oauth-code', state })
      .expect(302);

    expect(replayResponse.headers.location).toBe(
      'http://localhost:3000/login?authError=google_failed',
    );
  });

  it('/auth/google/callback (GET) blocks same-email password account linking', async () => {
    const email = `password-conflict-${Date.now()}@example.com`;
    await createTestRequest(app)
      .post('/auth/register')
      .send({
        username: `password-conflict-${Date.now()}`,
        email,
        password: 'Password123!',
      })
      .expect(201);

    const startResponse: Response = await createTestRequest(app)
      .get('/auth/google')
      .expect(302);
    const state = getRedirectState(startResponse);
    const nonce = getLastGoogleAuthUrlParams().nonce;
    googleOAuthService.verifyIdToken.mockResolvedValueOnce({
      sub: `conflict-sub-${Date.now()}`,
      email,
      emailVerified: true,
      nonce,
      issuer: 'https://accounts.google.com',
    });

    const callbackResponse: Response = await createTestRequest(app)
      .get('/auth/google/callback')
      .query({ code: 'oauth-code', state })
      .expect(302);

    expect(callbackResponse.headers.location).toBe(
      'http://localhost:3000/login?authError=google_failed',
    );
  });
});
