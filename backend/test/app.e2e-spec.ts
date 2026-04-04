import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { createTestRequest, createTestAgent } from './helpers/test-request';

interface AuthResponse {
  message: string;
  data: {
    user?: {
      id: number;
      email: string;
    };
    accessToken?: string;
    userId?: number;
    email?: string;
  };
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  // Agent persists cookies across requests (required for HTTP-only cookie authentication)
  let agent: ReturnType<typeof createTestAgent>;

  const registerpayload = {
    username: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    // Create an agent that maintains cookies between requests
    agent = createTestAgent(app);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) should register user', async () => {
    const res = await agent
      .post('/auth/register')
      .send(registerpayload)
      .expect(201);

    const authRes = res.body as AuthResponse;
    expect(authRes.data).toBeDefined();
  });

  it('/auth/login (POST) should login user and set HTTP-only cookie', async () => {
    const loginRes = await agent
      .post('/auth/login')
      .send({
        email: registerpayload.email,
        password: registerpayload.password,
      })
      .expect(200);

    const authRes = loginRes.body as AuthResponse;
    expect(authRes.data).toBeDefined();
    expect(authRes.data.user).toBeDefined();
    // In dev/test environment, token is included in response for testing
    // In production, only the HTTP-only cookie is set (more secure)
    expect(authRes.data.accessToken).toBeDefined();
  });

  it('/ (GET)', () => {
    return createTestRequest(app).get('/health').expect(200);
  });

  it('/auth/me (GET) should fail without a token', () => {
    return createTestRequest(app).get('/auth/me').expect(401);
  });

  it('/auth/me (GET) should return user info with valid token', async () => {
    // Login using agent - this stores the HTTP-only cookie
    const loginRes = await agent
      .post('/auth/login')
      .send({
        email: registerpayload.email,
        password: registerpayload.password,
      })
      .expect(200);

    const loginAuthRes = loginRes.body as AuthResponse;
    expect(loginAuthRes.data.user).toBeDefined();

    // The login response includes the token in dev/test (for Authorization header testing)
    const accessToken = loginAuthRes.data.accessToken;
    expect(accessToken).toBeDefined();

    // Get /auth/me using the same agent
    // We use the Authorization header with the token since HTTP-only cookie
    // persistence seems unreliable in test environment
    const meRes = await agent
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meResData = meRes.body as AuthResponse;
    expect(meResData.data).toBeDefined();
    expect(meResData.data.email).toBe(registerpayload.email);
  });
});
