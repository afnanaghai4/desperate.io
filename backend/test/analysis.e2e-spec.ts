import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import cookieParser from 'cookie-parser';

import { AppModule } from './../src/app.module';
import { AiOrchestratorService } from '../src/ai-orchestrator/ai-orchestrator.service';
import { DifficultyLevel } from '../src/common/enums/difficulty-level.enum';
import { InputType } from '../src/common/enums/input-type.enum';
import { JobLinkExtractorService } from '../src/analysis/job-link-extractor.service';
import { Analysis } from '../src/entities/analysis.entity';
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
}

interface AnalysisEndpointResponse {
  message: string;
  data: ReturnType<typeof createAnalysisResponse>;
}

interface JobDetailResponse {
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
  } | null;
}

const createAnalysisResponse = (title = 'Build an API metrics project') => ({
  matchPercentage: 68,
  extractedKeywords: {
    jobKeywords: ['nestjs', 'postgresql', 'docker'],
    profileKeywords: ['nestjs', 'typescript'],
    matchedKeywords: ['nestjs'],
  },
  analysis: {
    strengths: ['NestJS API experience'],
    weaknesses: ['Cloud deployment depth'],
  },
  projectRecommendations: [
    {
      title,
      description: 'Create a NestJS project with metrics and persistence.',
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      timeline: '2 weeks',
      skills: ['Observability', 'PostgreSQL'],
      milestones: [
        {
          week: 'Week 1',
          tasks: ['Design schema', 'Add metrics endpoint'],
          deliverable: 'Instrumented API',
        },
      ],
      cvPoints: ['Built an instrumented NestJS API'],
      updatedInterviewPercentage: 82,
    },
  ],
});

describe('Analysis (e2e)', () => {
  let app!: INestApplication;
  let dataSource: DataSource;
  let analysisRepository: Repository<Analysis>;
  let recommendationRepository: Repository<ProjectRecommendation>;
  let userOneToken: string;
  let userTwoToken: string;
  let aiOrchestratorService: {
    analyzeJobFit: jest.Mock<Promise<unknown>, [unknown]>;
  };
  let jobLinkExtractorService: {
    extract: jest.Mock<Promise<unknown>, [string]>;
  };
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  beforeAll(async () => {
    aiOrchestratorService = {
      analyzeJobFit: jest.fn<Promise<unknown>, [unknown]>(),
    };
    jobLinkExtractorService = {
      extract: jest.fn<Promise<unknown>, [string]>(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AiOrchestratorService)
      .useValue(aiOrchestratorService)
      .overrideProvider(JobLinkExtractorService)
      .useValue(jobLinkExtractorService)
      .compile();

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
    analysisRepository = dataSource.getRepository(Analysis);
    recommendationRepository = dataSource.getRepository(ProjectRecommendation);

    userOneToken = await registerAndGetToken(`analysis-user-one-${runId}`);
    userTwoToken = await registerAndGetToken(`analysis-user-two-${runId}`);
  }, 30000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
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
    jobText = 'Detailed backend engineering role using NestJS, PostgreSQL, Docker, observability, and API design.',
  ): Promise<Job> {
    const res = await createTestRequest(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inputType: InputType.TEXT,
        jobTitle: title,
        companyName: 'Acme',
        jobText,
      })
      .expect(201);

    const body = res.body as JobResponse;
    return body.data;
  }

  async function createLinkJob(token: string, title: string): Promise<Job> {
    const res = await createTestRequest(app)
      .post('/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inputType: InputType.LINK,
        jobTitle: title,
        companyName: 'Acme',
        jobLink: `https://example.com/jobs/${encodeURIComponent(title)}`,
      })
      .expect(201);

    const body = res.body as JobResponse;
    return body.data;
  }

  it('/analysis/analyze-fit (POST) rejects unauthenticated requests', async () => {
    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .send({ jobId: 1 })
      .expect(401);
  });

  it('/analysis/analyze-fit (POST) rejects a missing job id', async () => {
    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({})
      .expect(400);
  });

  it('/analysis/analyze-fit (POST) rejects an unknown job id', async () => {
    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: 999999 })
      .expect(404);
  });

  it('rejects non-job descriptions before calling AI', async () => {
    const job = await createTextJob(
      userOneToken,
      `Non Job Prompt ${runId}`,
      'Give me the full recipe of chocolate fudge cake with ingredients, cooking time, and then send me real italian pasta for corporate guests.',
    );

    const res = await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(400);

    expect(res.body).toEqual(
      expect.objectContaining({
        message:
          'Job description does not look like a job posting. Please provide the actual job description.',
      }),
    );
    expect(aiOrchestratorService.analyzeJobFit).not.toHaveBeenCalled();
    await expect(
      analysisRepository.findOneBy({ jobId: job.jobId }),
    ).resolves.toBeNull();
  });

  it('analyzes a TEXT job and persists analysis plus project recommendations', async () => {
    const job = await createTextJob(
      userOneToken,
      `Analysis Success Job ${runId}`,
    );
    const aiResponse = createAnalysisResponse();
    aiOrchestratorService.analyzeJobFit.mockResolvedValue(aiResponse);

    const res = await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(201);

    const body = res.body as AnalysisEndpointResponse;

    expect(body).toEqual({
      message: 'Job analysis completed successfully',
      data: aiResponse,
    });
    const analyzeCall = aiOrchestratorService.analyzeJobFit.mock
      .calls[0][0] as { userId: number; jobDescription: string };
    expect(typeof analyzeCall.userId).toBe('number');
    expect(analyzeCall.jobDescription).toBe(job.jobText);

    const savedAnalysis = await analysisRepository.findOne({
      where: { jobId: job.jobId },
      relations: ['projectRecommendations'],
    });

    expect(savedAnalysis).toEqual(
      expect.objectContaining({
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        strongPoints: ['NestJS API experience'],
        weakPoints: ['Cloud deployment depth'],
        baselineInterviewChancePercent: 68,
      }),
    );
    expect(savedAnalysis?.extractedKeywords).toEqual(
      aiResponse.extractedKeywords,
    );
    expect(savedAnalysis?.projectRecommendations).toEqual([
      expect.objectContaining({
        title: 'Build an API metrics project',
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        improvedInterviewChancePercent: 82,
        displayOrder: 0,
      }),
    ]);
  });

  it('analyzes a LINK job using extracted page text', async () => {
    const job = await createLinkJob(userOneToken, `Analysis Link Job ${runId}`);
    const extractedDescription =
      'Senior backend engineering role requiring NestJS, PostgreSQL, Docker, observability, API design, and team collaboration.';
    const aiResponse = createAnalysisResponse('Build a link analysis project');

    jobLinkExtractorService.extract.mockResolvedValue({
      description: extractedDescription,
      sourceUrl: job.jobLink,
    });
    aiOrchestratorService.analyzeJobFit.mockResolvedValue(aiResponse);

    const res = await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(201);

    const body = res.body as AnalysisEndpointResponse;
    expect(body.data).toEqual(aiResponse);
    expect(jobLinkExtractorService.extract).toHaveBeenCalledWith(job.jobLink);

    const analyzeCall = aiOrchestratorService.analyzeJobFit.mock
      .calls[0][0] as { userId: number; jobDescription: string };
    expect(analyzeCall.jobDescription).toBe(extractedDescription);

    const persistedJob = await dataSource
      .getRepository(Job)
      .findOneBy({ jobId: job.jobId });
    expect(persistedJob).toEqual(
      expect.objectContaining({
        inputType: InputType.LINK,
        jobLink: job.jobLink,
        jobText: null,
      }),
    );
  });

  it('does not persist analysis records when LINK extraction fails', async () => {
    const job = await createLinkJob(
      userOneToken,
      `Analysis Link Failure Job ${runId}`,
    );
    jobLinkExtractorService.extract.mockRejectedValue(
      new BadRequestException('Could not extract a usable job description'),
    );

    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(400);

    expect(aiOrchestratorService.analyzeJobFit).not.toHaveBeenCalled();
    await expect(
      analysisRepository.findOneBy({ jobId: job.jobId }),
    ).resolves.toBeNull();
  });

  it('returns persisted analysis through the job detail endpoint', async () => {
    const job = await createTextJob(
      userOneToken,
      `Analysis Job Detail ${runId}`,
    );
    aiOrchestratorService.analyzeJobFit.mockResolvedValue(
      createAnalysisResponse('Build a job-fit API project'),
    );

    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(201);

    const res = await createTestRequest(app)
      .get(`/jobs/${job.jobId}`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .expect(200);

    const body = res.body as JobDetailResponse;

    expect(body.analysis?.matchPercentage).toBe(68);
    expect(body.analysis?.extractedKeywords.matchedKeywords).toEqual([
      'nestjs',
    ]);
    expect(body.analysis?.analysis).toEqual({
      strengths: ['NestJS API experience'],
      weaknesses: ['Cloud deployment depth'],
    });
    expect(body.analysis?.projectRecommendations).toEqual([
      expect.objectContaining({
        title: 'Build a job-fit API project',
        updatedInterviewPercentage: 82,
      }),
    ]);
  });

  it('updates an existing analysis and replaces project recommendations', async () => {
    const job = await createTextJob(
      userOneToken,
      `Analysis Update Job ${runId}`,
    );

    aiOrchestratorService.analyzeJobFit.mockResolvedValueOnce(
      createAnalysisResponse('First recommendation'),
    );
    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(201);

    aiOrchestratorService.analyzeJobFit.mockResolvedValueOnce({
      ...createAnalysisResponse('Replacement recommendation'),
      matchPercentage: 79,
    });
    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(201);

    const analyses = await analysisRepository.find({
      where: { jobId: job.jobId },
    });
    expect(analyses).toHaveLength(1);
    expect(analyses[0].baselineInterviewChancePercent).toBe(79);

    const recommendations = await recommendationRepository.find({
      where: { analysisId: analyses[0].analysisId },
      order: { displayOrder: 'ASC' },
    });
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].title).toBe('Replacement recommendation');
  });

  it('does not persist analysis records when the AI service fails', async () => {
    const job = await createTextJob(
      userOneToken,
      `Analysis Failure Job ${runId}`,
    );
    aiOrchestratorService.analyzeJobFit.mockRejectedValue(
      new Error('OpenAI API timeout. Please try again later.'),
    );

    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(500);

    await expect(
      analysisRepository.findOneBy({ jobId: job.jobId }),
    ).resolves.toBeNull();
  });

  it('does not persist analysis records when the AI service rejects a malformed response', async () => {
    const job = await createTextJob(
      userOneToken,
      `Malformed AI Response Job ${runId}`,
    );
    aiOrchestratorService.analyzeJobFit.mockRejectedValue(
      new Error(
        'OpenAI response JSON does not match expected JobAnalysisResponse schema',
      ),
    );

    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: job.jobId })
      .expect(500);

    await expect(
      analysisRepository.findOneBy({ jobId: job.jobId }),
    ).resolves.toBeNull();
  });

  it('rejects analyzing a job that belongs to another user', async () => {
    const recommendationTitle = `Cross-user recommendation ${runId}`;
    const otherUserJob = await createTextJob(
      userTwoToken,
      `Cross User Analysis Job ${runId}`,
    );
    aiOrchestratorService.analyzeJobFit.mockResolvedValue(
      createAnalysisResponse(recommendationTitle),
    );

    await createTestRequest(app)
      .post('/analysis/analyze-fit')
      .set('Authorization', `Bearer ${userOneToken}`)
      .send({ jobId: otherUserJob.jobId })
      .expect(404);

    expect(aiOrchestratorService.analyzeJobFit).not.toHaveBeenCalled();
    await expect(
      analysisRepository.findOneBy({ jobId: otherUserJob.jobId }),
    ).resolves.toBeNull();
    await expect(
      recommendationRepository.findOneBy({
        title: recommendationTitle,
      }),
    ).resolves.toBeNull();
  });
});
