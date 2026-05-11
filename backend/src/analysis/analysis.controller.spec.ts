import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { DifficultyLevel } from '../common/enums/difficulty-level.enum';
import {
  AiOrchestratorService,
  JobAnalysisResponse,
} from '../ai-orchestrator/ai-orchestrator.service';
import { Job } from '../entities/job.entity';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';

type MockRepository<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn(),
});

const analysisResponse: JobAnalysisResponse = {
  matchPercentage: 74,
  extractedKeywords: {
    jobKeywords: ['nestjs', 'postgresql'],
    profileKeywords: ['nestjs', 'typescript'],
    matchedKeywords: ['nestjs'],
  },
  analysis: {
    strengths: ['API experience'],
    weaknesses: ['Cloud depth'],
  },
  projectRecommendations: [
    {
      title: 'Build an API observability project',
      description: 'Add metrics and tracing to a NestJS API.',
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      timeline: '2 weeks',
      skills: ['Observability'],
      milestones: [
        {
          week: 'Week 1',
          tasks: ['Add metrics'],
          deliverable: 'Metrics endpoint',
        },
      ],
      cvPoints: ['Improved API observability'],
      updatedInterviewPercentage: 86,
    },
  ],
};

describe('AnalysisController', () => {
  let controller: AnalysisController;
  let aiOrchestratorService: {
    analyzeJobFit: jest.Mock;
  };
  let analysisService: {
    saveAnalysis: jest.Mock;
  };
  let jobRepository: MockRepository<Job>;
  let authRequest: Parameters<AnalysisController['analyzeFit']>[1];
  let invalidAuthRequest: Parameters<AnalysisController['analyzeFit']>[1];

  beforeEach(async () => {
    aiOrchestratorService = {
      analyzeJobFit: jest.fn(),
    };
    analysisService = {
      saveAnalysis: jest.fn(),
    };
    jobRepository = createMockRepository<Job>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: AiOrchestratorService,
          useValue: aiOrchestratorService,
        },
        {
          provide: AnalysisService,
          useValue: analysisService,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: jobRepository,
        },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    authRequest = {
      user: { userId: 42, email: 'user@example.com' },
    } as Parameters<AnalysisController['analyzeFit']>[1];
    invalidAuthRequest = {
      user: {},
    } as unknown as Parameters<AnalysisController['analyzeFit']>[1];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('analyzes a TEXT job and saves the analysis', async () => {
    const job = {
      jobId: 5,
      jobTitle: 'Backend Engineer',
      companyName: 'Acme',
      jobText: 'Detailed backend engineering role using NestJS.',
      jobLink: null,
    } as Job;
    jobRepository.findOne?.mockResolvedValue(job);
    aiOrchestratorService.analyzeJobFit.mockResolvedValue(analysisResponse);

    const result = await controller.analyzeFit({ jobId: 5 }, authRequest);

    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { jobId: 5, userId: 42 },
    });
    expect(aiOrchestratorService.analyzeJobFit).toHaveBeenCalledWith({
      userId: 42,
      jobDescription: job.jobText,
    });
    expect(analysisService.saveAnalysis).toHaveBeenCalledWith(
      5,
      'Backend Engineer',
      'Acme',
      analysisResponse,
    );
    expect(result).toEqual({
      message: 'Job analysis completed successfully',
      data: analysisResponse,
    });
  });

  it('rejects a missing job id', async () => {
    await expect(
      controller.analyzeFit({ jobId: 0 }, authRequest),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a missing job', async () => {
    jobRepository.findOne?.mockResolvedValue(null);

    await expect(
      controller.analyzeFit({ jobId: 999 }, authRequest),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a job without text or link', async () => {
    jobRepository.findOne?.mockResolvedValue({
      jobId: 5,
      jobText: null,
      jobLink: null,
    } as Job);

    await expect(
      controller.analyzeFit({ jobId: 5 }, authRequest),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an invalid authenticated user context', async () => {
    await expect(
      controller.analyzeFit({ jobId: 5 }, invalidAuthRequest),
    ).rejects.toThrow(BadRequestException);

    expect(jobRepository.findOne).not.toHaveBeenCalled();
  });

  it('propagates AI failures and does not save an analysis', async () => {
    jobRepository.findOne?.mockResolvedValue({
      jobId: 5,
      jobText: 'Detailed backend engineering role using NestJS.',
      jobLink: null,
    } as Job);
    aiOrchestratorService.analyzeJobFit.mockRejectedValue(
      new InternalServerErrorException('AI unavailable'),
    );

    await expect(
      controller.analyzeFit({ jobId: 5 }, authRequest),
    ).rejects.toThrow(InternalServerErrorException);

    expect(analysisService.saveAnalysis).not.toHaveBeenCalled();
  });
});
