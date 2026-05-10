import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import cookieParser from 'cookie-parser';

import { AppModule } from './../src/app.module';
import { Analysis } from '../src/entities/analysis.entity';
import { DifficultyLevel } from '../src/common/enums/difficulty-level.enum';
import { InputType } from '../src/common/enums/input-type.enum';
import { Job } from '../src/entities/job.entity';
import { ProjectRecommendation } from '../src/entities/project-recommendation.entity';
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

interface JobResponse {
  message: string;
  data: Job;
  analysis?: unknown;
}

interface JobListResponse {
  message: string;
  data: Job[];
  hasMore: boolean;
  totalCount: number;
  totalPages: number;
}

describe('Jobs (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jobRepository: Repository<Job>;
  let analysisRepository: Repository<Analysis>;
  let recommendationRepository: Repository<ProjectRecommendation>;
  let userOneToken: string;
  let userTwoToken: string;
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

    dataSource = app.get(DataSource);
    jobRepository = dataSource.getRepository(Job);
    analysisRepository = dataSource.getRepository(Analysis);
    recommendationRepository = dataSource.getRepository(ProjectRecommendation);

    userOneToken = await registerAndGetToken(`jobs-user-one-${runId}`);
    userTwoToken = await registerAndGetToken(`jobs-user-two-${runId}`);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function registerAndGetToken(username: string): Promise<string> {
    const res = await createTestRequest(app)
      .post('/auth/register')
      .send({
        username,
        email: `${username}@example.com`,
        password: 'Password123!',
      })
      .expect(201);

    const authResponse = res.body as AuthResponse;
    return authResponse.data.accessToken;
  }

  async function createTextJob(
    token: string,
    title: string,
  ): Promise<JobResponse> {
    const res = await createTestRequest(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inputType: InputType.TEXT,
        jobTitle: title,
        companyName: 'Acme',
        jobText: `Detailed backend engineering role for ${title} using NestJS and PostgreSQL.`,
      })
      .expect(201);

    return res.body as JobResponse;
  }

  it('creates a job with TEXT input', async () => {
    const body = await createTextJob(userOneToken, `Text Job ${runId}`);

    expect(body.message).toBe('Job created successfully');
    expect(body.data.jobId).toEqual(expect.any(Number));
    expect(body.data.inputType).toBe(InputType.TEXT);
    expect(body.data.jobText).toContain('Detailed backend engineering role');
    expect(body.data.jobLink).toBeNull();
  });

  it('creates a job with LINK input', async () => {
    const res = await createTestRequest(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        inputType: InputType.LINK,
        jobTitle: `Link Job ${runId}`,
        companyName: 'Acme',
        jobLink: `https://example.com/jobs/${runId}`,
      })
      .expect(201);

    const body = res.body as JobResponse;
    expect(body.data.inputType).toBe(InputType.LINK);
    expect(body.data.jobLink).toBe(`https://example.com/jobs/${runId}`);
    expect(body.data.jobText).toBeNull();
  });

  it('rejects both TEXT and LINK together', async () => {
    await createTestRequest(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        inputType: InputType.TEXT,
        jobText: 'A detailed backend engineer job description.',
        jobLink: 'https://example.com/jobs/backend-engineer',
      })
      .expect(400);
  });

  it('rejects neither TEXT nor LINK', async () => {
    await createTestRequest(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({
        inputType: InputType.TEXT,
      })
      .expect(400);
  });

  it("lists only the authenticated user's jobs", async () => {
    const ownJob = await createTextJob(userOneToken, `Own Listed Job ${runId}`);
    const otherJob = await createTextJob(
      userTwoToken,
      `Other User Job ${runId}`,
    );

    const res = await createTestRequest(app)
      .get('/jobs')
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const body = res.body as JobListResponse;
    const jobIds = body.data.map((job) => job.jobId);

    expect(body.message).toBe('Jobs retrieved successfully');
    expect(jobIds).toContain(ownJob.data.jobId);
    expect(jobIds).not.toContain(otherJob.data.jobId);
  });

  it('returns pagination metadata and hasMore behavior', async () => {
    await createTextJob(userOneToken, `Pagination A ${runId}`);
    await createTextJob(userOneToken, `Pagination B ${runId}`);
    await createTextJob(userOneToken, `Pagination C ${runId}`);

    const res = await createTestRequest(app)
      .get('/jobs')
      .query({ skip: 0, take: 2 })
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const body = res.body as JobListResponse;

    expect(body.data).toHaveLength(2);
    expect(body.totalCount).toBeGreaterThanOrEqual(3);
    expect(body.hasMore).toBe(true);
    expect(body.totalPages).toBe(Math.ceil(body.totalCount / 2));
  });

  it('opens own job by ID', async () => {
    const created = await createTextJob(userOneToken, `Open Own Job ${runId}`);

    const res = await createTestRequest(app)
      .get(`/jobs/${created.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const body = res.body as JobResponse;
    expect(body.message).toBe(
      'Job and possible analysis retrieved successfully',
    );
    expect(body.data.jobId).toBe(created.data.jobId);
    expect(body.analysis).toBeNull();
  });

  it("rejects opening another user's job", async () => {
    const otherJob = await createTextJob(userTwoToken, `Private Job ${runId}`);

    await createTestRequest(app)
      .get(`/jobs/${otherJob.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(404);
  });

  it('deletes own job', async () => {
    const created = await createTextJob(
      userOneToken,
      `Delete Own Job ${runId}`,
    );

    await createTestRequest(app)
      .delete(`/jobs/${created.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    await createTestRequest(app)
      .get(`/jobs/${created.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(404);
  });

  it("reports current behavior when deleting another user's job", async () => {
    const otherJob = await createTextJob(
      userTwoToken,
      `Unauthorized Delete Job ${runId}`,
    );

    await createTestRequest(app)
      .delete(`/jobs/${otherJob.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(500);
  });

  it('returns existing analysis with a job when present', async () => {
    const created = await createTextJob(
      userOneToken,
      `Analyzed Existing Job ${runId}`,
    );

    const savedAnalysis: Analysis = await analysisRepository.save(
      analysisRepository.create({
        jobId: created.data.jobId,
        jobTitle: created.data.jobTitle,
        companyName: created.data.companyName,
        strongPoints: ['NestJS experience'],
        weakPoints: ['Cloud depth'],
        roleDirection: null,
        skills: [],
        tools: [],
        cloudPlatforms: [],
        databases: [],
        frameworks: [],
        baselineInterviewChancePercent: 72,
        seniority: null,
        domain: null,
        extractedKeywords: {
          jobKeywords: ['nestjs', 'postgresql'],
          profileKeywords: ['nestjs'],
          matchedKeywords: ['nestjs'],
        },
      }),
    );

    await recommendationRepository.save({
      analysisId: savedAnalysis.analysisId,
      title: 'Build a job tracker API',
      description: 'Create a backend project with auth and persistence.',
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      timeline: '2 weeks',
      techStack: ['NestJS', 'PostgreSQL'],
      skills: ['API design'],
      milestones: [
        {
          week: 'Week 1',
          tasks: ['Design schema'],
          deliverable: 'Working API',
        },
      ],
      cvPoints: ['Built a production-style API'],
      improvedInterviewChancePercent: 84,
      displayOrder: 0,
    });

    const res = await createTestRequest(app)
      .get(`/jobs/${created.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const body = res.body as {
      data: Job;
      analysis: {
        matchPercentage: number;
        extractedKeywords: {
          jobKeywords: string[];
          profileKeywords: string[];
          matchedKeywords: string[];
        };
        analysis: {
          strengths: string[];
          weaknesses: string[];
        };
        projectRecommendations: Array<{
          title: string;
          updatedInterviewPercentage: number;
        }>;
      };
    };

    expect(body.data.jobId).toBe(created.data.jobId);
    expect(body.analysis.matchPercentage).toBe(72);
    expect(body.analysis.extractedKeywords.matchedKeywords).toEqual(['nestjs']);
    expect(body.analysis.analysis.strengths).toEqual(['NestJS experience']);
    expect(body.analysis.projectRecommendations).toEqual([
      expect.objectContaining({
        title: 'Build a job tracker API',
        updatedInterviewPercentage: 84,
      }),
    ]);
  });

  it('persists rejected unauthorized delete target', async () => {
    const otherJob = await createTextJob(
      userTwoToken,
      `Persist Unauthorized Delete Target ${runId}`,
    );

    await createTestRequest(app)
      .delete(`/jobs/${otherJob.data.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(500);

    await expect(
      jobRepository.findOneBy({ jobId: otherJob.data.jobId }),
    ).resolves.toEqual(expect.objectContaining({ jobId: otherJob.data.jobId }));
  });
});
