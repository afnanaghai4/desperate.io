import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './../src/app.module';
import { createTestRequest } from './helpers/test-request';

interface AuthResponse {
  data: {
    accessToken: string;
    user: {
      id: number;
      email: string;
    };
  };
}

interface ProfileResponse {
  message: string;
  data: {
    profileDetails: Record<string, unknown> | null;
    email: string;
    username: string;
  };
}

interface UserEntityResponse {
  userId: number;
  username: string;
  email: string;
  profileDetails: Record<string, unknown> | null;
  passwordHash?: string;
}

describe('Users/Profile (e2e)', () => {
  let app: INestApplication;
  let userOneToken: string;
  let userTwoToken: string;
  let userOneEmail: string;
  let userTwoEmail: string;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const userOne = await registerAndGetToken(`profile-user-one-${runId}`);
    const userTwo = await registerAndGetToken(`profile-user-two-${runId}`);
    userOneToken = userOne.accessToken;
    userTwoToken = userTwo.accessToken;
    userOneEmail = userOne.email;
    userTwoEmail = userTwo.email;
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  async function registerAndGetToken(
    username: string,
  ): Promise<{ accessToken: string; email: string }> {
    const email = `${username}@example.com`;
    const res = await createTestRequest(app)
      .post('/auth/register')
      .send({
        username,
        email,
        password: 'Password123!',
      })
      .expect(201);

    const authResponse = res.body as AuthResponse;
    return {
      accessToken: authResponse.data.accessToken,
      email,
    };
  }

  it('rejects unauthenticated profile requests', async () => {
    await createTestRequest(app).get('/users/profile').expect(401);
    await createTestRequest(app)
      .post('/users/profile')
      .send({ personalInfo: { fullName: 'Unauthenticated User' } })
      .expect(401);
    await createTestRequest(app)
      .patch('/users/profile')
      .send({ personalInfo: { fullName: 'Unauthenticated User' } })
      .expect(401);
  });

  it('gets the authenticated user profile without exposing password hash', async () => {
    const res = await createTestRequest(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const body = res.body as ProfileResponse;
    expect(body).toEqual({
      message: 'Profile retrieved successfully',
      data: {
        profileDetails: null,
        email: userOneEmail,
        username: `profile-user-one-${runId}`,
      },
    });
    expect(JSON.stringify(body)).not.toContain('passwordHash');
  });

  it('creates a profile for the authenticated user', async () => {
    const res = await createTestRequest(app)
      .post('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        personalInfo: {
          fullName: 'Profile User One',
          phone: '+4911111111',
          address: 'Berlin',
        },
        experiences: [
          {
            currentPosition: 'Backend Engineer',
            company: 'Acme',
            experience: '3 years',
            skills: 'NestJS, PostgreSQL',
            currentlyWorking: true,
          },
        ],
        educations: [
          {
            instituteName: 'Technical University Berlin',
            degreeName: 'Master of Science',
            fieldOfStudy: 'Computer Science',
            startDate: '2022-10-01',
            endDate: '2024-09-30',
            currentlyAttending: false,
            gradeCgpa: '1.7',
            description: 'Distributed systems and backend engineering',
          },
        ],
      })
      .expect(201);

    const body = res.body as UserEntityResponse;
    expect(body.email).toBe(userOneEmail);
    expect(body.profileDetails).toEqual({
      personalInfo: {
        fullName: 'Profile User One',
        phone: '+4911111111',
        address: 'Berlin',
      },
      experiences: [
        {
          currentPosition: 'Backend Engineer',
          company: 'Acme',
          experience: '3 years',
          skills: 'NestJS, PostgreSQL',
          currentlyWorking: true,
        },
      ],
      educations: [
        {
          instituteName: 'Technical University Berlin',
          degreeName: 'Master of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2022-10-01',
          endDate: '2024-09-30',
          currentlyAttending: false,
          gradeCgpa: '1.7',
          description: 'Distributed systems and backend engineering',
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain('passwordHash');
  });

  it('rejects duplicate profile creation for the same user', async () => {
    await createTestRequest(app)
      .post('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ personalInfo: { fullName: 'Duplicate Profile' } })
      .expect(400);
  });

  it('updates the authenticated user profile and preserves unrelated top-level fields', async () => {
    const res = await createTestRequest(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        personalInfo: {
          fullName: 'Updated Profile User One',
          phone: '+4922222222',
        },
        educations: [
          {
            instituteName: 'Humboldt University',
            degreeName: 'Bachelor of Science',
            fieldOfStudy: 'Software Engineering',
            startDate: '2018-10-01',
            currentlyAttending: true,
            gradeCgpa: '2.0',
            description: 'Backend and database coursework',
          },
        ],
      })
      .expect(200);

    const body = res.body as ProfileResponse;
    expect(body.message).toBe('Profile updated successfully');
    expect(body.data.email).toBe(userOneEmail);
    expect(body.data.profileDetails).toEqual({
      personalInfo: {
        fullName: 'Updated Profile User One',
        phone: '+4922222222',
      },
      experiences: [
        {
          currentPosition: 'Backend Engineer',
          company: 'Acme',
          experience: '3 years',
          skills: 'NestJS, PostgreSQL',
          currentlyWorking: true,
        },
      ],
      educations: [
        {
          instituteName: 'Humboldt University',
          degreeName: 'Bachelor of Science',
          fieldOfStudy: 'Software Engineering',
          startDate: '2018-10-01',
          currentlyAttending: true,
          gradeCgpa: '2.0',
          description: 'Backend and database coursework',
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain('passwordHash');
  });

  it('rejects invalid profile payloads', async () => {
    await createTestRequest(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        personalInfo: {
          email: 'not-an-email',
        },
      })
      .expect(400);

    await createTestRequest(app)
      .post('/users/profile')
      .set('Authorization', `Bearer ${userTwoToken}`)
      .send({
        experiences: 'not-an-array',
      })
      .expect(400);
  });

  it('does not trust userId from the request body', async () => {
    await createTestRequest(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        userId: 999999,
        personalInfo: { fullName: 'Injected User Id' },
      })
      .expect(400);

    const otherUserRes = await createTestRequest(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(200);

    const otherUserBody = otherUserRes.body as ProfileResponse;
    expect(otherUserBody.data.email).toBe(userTwoEmail);
    expect(otherUserBody.data.profileDetails).toBeNull();
    expect(JSON.stringify(otherUserBody)).not.toContain('passwordHash');
  });

  it('keeps profile operations scoped to the authenticated user', async () => {
    await createTestRequest(app)
      .post('/users/profile')
      .set('Authorization', `Bearer ${userTwoToken}`)
      .send({
        personalInfo: {
          fullName: 'Profile User Two',
        },
      })
      .expect(201);

    const userOneRes = await createTestRequest(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const userTwoRes = await createTestRequest(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(200);

    const userOneBody = userOneRes.body as ProfileResponse;
    const userTwoBody = userTwoRes.body as ProfileResponse;

    expect(userOneBody.data.email).toBe(userOneEmail);
    expect(userOneBody.data.profileDetails?.personalInfo).toEqual({
      fullName: 'Updated Profile User One',
      phone: '+4922222222',
    });
    expect(userOneBody.data.profileDetails?.educations).toEqual([
      {
        instituteName: 'Humboldt University',
        degreeName: 'Bachelor of Science',
        fieldOfStudy: 'Software Engineering',
        startDate: '2018-10-01',
        currentlyAttending: true,
        gradeCgpa: '2.0',
        description: 'Backend and database coursework',
      },
    ]);
    expect(userTwoBody.data.email).toBe(userTwoEmail);
    expect(userTwoBody.data.profileDetails).toEqual({
      personalInfo: {
        fullName: 'Profile User Two',
      },
    });
  });
});
