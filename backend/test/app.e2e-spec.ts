import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { createTestRequest } from './helpers/test-request';

interface AuthResponse {
  message: string;
  data: {
    user?: {
      id: number;
      email: string;
    };
    accessToken?: string;
  };
}

describe('Auth (e2e)', () => {
  let app: INestApplication;

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
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) should register user', async () => {
    const res = await createTestRequest(app)
      .post('/auth/register')
      .send(registerpayload)
      .expect(201);

    const authRes = res.body as AuthResponse;
    expect(authRes.data).toBeDefined();
  });

  it('/auth/login (POST) should login user', async () => {
    const loginRes = await createTestRequest(app)
      .post('/auth/login')
      .send({
        email: registerpayload.email,
        password: registerpayload.password,
      })
      .expect(201);

    const authRes = loginRes.body as AuthResponse;
    expect(authRes.data).toBeDefined();
  });

  it('/ (GET)', () => {
    return createTestRequest(app).get('/health').expect(200);
  });

  it('/auth/me (GET) should fail without a token', () => {
    return createTestRequest(app).get('/auth/me').expect(401);
  });

  it('/auth/me (GET) should return user info with valid token', async () => {
    const loginRes = await createTestRequest(app)
      .post('/auth/login')
      .send({
        email: registerpayload.email,
        password: registerpayload.password,
      })
      .expect(201);

    const loginAuthRes = loginRes.body as AuthResponse;
    const token = loginAuthRes.data.accessToken;

    const meRes = await createTestRequest(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const meResData = meRes.body as AuthResponse;
    expect(meResData.data).toBeDefined();
    expect(meResData.data.user?.email).toBe(registerpayload.email);
  });
});
