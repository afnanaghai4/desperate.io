import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';

import { DifficultyLevel } from '../common/enums/difficulty-level.enum';
import { Analysis } from '../entities/analysis.entity';
import { ProjectRecommendation } from '../entities/project-recommendation.entity';
import { JobAnalysisResponse } from '../ai-orchestrator/ai-orchestrator.service';
import { AnalysisService } from './analysis.service';

type MockRepository<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn(),
});

const analysisResponse: JobAnalysisResponse = {
  matchPercentage: 67,
  extractedKeywords: {
    jobKeywords: ['nestjs', 'postgresql'],
    profileKeywords: ['nestjs', 'typescript'],
    matchedKeywords: ['nestjs'],
  },
  analysis: {
    strengths: ['NestJS experience'],
    weaknesses: ['Cloud deployment depth'],
  },
  projectRecommendations: [
    {
      title: 'Build a deployment dashboard',
      description: 'Create a backend dashboard with deployment metrics.',
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      timeline: '2 weeks',
      skills: ['Cloud deployment', 'API design'],
      milestones: [
        {
          week: 'Week 1',
          tasks: ['Design schema'],
          deliverable: 'Database model',
        },
      ],
      cvPoints: ['Built a production-style deployment dashboard'],
      updatedInterviewPercentage: 82,
    },
  ],
};

describe('AnalysisService', () => {
  let service: AnalysisService;
  let analysisRepository: MockRepository<Analysis>;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      findOne: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    analysisRepository = createMockRepository<Analysis>();

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(
          (_entity: unknown, payload: unknown): unknown => payload,
        ),
        save: jest.fn((_entity, payload) =>
          Array.isArray(payload)
            ? Promise.resolve(payload)
            : Promise.resolve({ analysisId: 10, ...payload }),
        ),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: getRepositoryToken(Analysis),
          useValue: analysisRepository,
        },
        {
          provide: getRepositoryToken(ProjectRecommendation),
          useValue: {},
        },
        {
          provide: getDataSourceToken(),
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          } satisfies Partial<DataSource>,
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('gets an analysis by job id with project recommendations', async () => {
    const analysis = { analysisId: 1, jobId: 5 } as Analysis;
    analysisRepository.findOne?.mockResolvedValue(analysis);

    const result = await service.getAnalysisByJobId(5);

    expect(analysisRepository.findOne).toHaveBeenCalledWith({
      where: { jobId: 5 },
      relations: ['projectRecommendations'],
    });
    expect(result).toBe(analysis);
  });

  it('creates a new analysis and project recommendations in a transaction', async () => {
    queryRunner.manager.findOne.mockResolvedValue(null);

    const result = await service.saveAnalysis(
      5,
      'Backend Engineer',
      'Acme',
      analysisResponse,
    );

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.create).toHaveBeenCalledWith(Analysis, {
      jobId: 5,
      jobTitle: 'Backend Engineer',
      companyName: 'Acme',
      strongPoints: ['NestJS experience'],
      weakPoints: ['Cloud deployment depth'],
      baselineInterviewChancePercent: 67,
      extractedKeywords: analysisResponse.extractedKeywords,
    });
    expect(queryRunner.manager.delete).toHaveBeenCalledWith(
      ProjectRecommendation,
      { analysisId: 10 },
    );
    expect(queryRunner.manager.create).toHaveBeenCalledWith(
      ProjectRecommendation,
      expect.objectContaining({
        analysisId: 10,
        title: 'Build a deployment dashboard',
        displayOrder: 0,
        improvedInterviewChancePercent: 82,
      }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ analysisId: 10 }));
  });

  it('updates an existing analysis and replaces recommendations', async () => {
    const existingAnalysis = {
      analysisId: 22,
      jobId: 5,
      jobTitle: 'Old title',
      companyName: 'Old company',
      strongPoints: ['Old strength'],
      weakPoints: ['Old weakness'],
      baselineInterviewChancePercent: 30,
      extractedKeywords: null,
    } as Analysis;

    queryRunner.manager.findOne.mockResolvedValue(existingAnalysis);
    queryRunner.manager.save.mockImplementation((_entity, payload) =>
      Promise.resolve(payload),
    );

    const result = await service.saveAnalysis(
      5,
      'Backend Engineer',
      null,
      analysisResponse,
    );

    expect(queryRunner.manager.create).not.toHaveBeenCalledWith(
      Analysis,
      expect.anything(),
    );
    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      Analysis,
      expect.objectContaining({
        analysisId: 22,
        jobTitle: 'Backend Engineer',
        companyName: null,
        strongPoints: ['NestJS experience'],
        weakPoints: ['Cloud deployment depth'],
        baselineInterviewChancePercent: 67,
      }),
    );
    expect(queryRunner.manager.delete).toHaveBeenCalledWith(
      ProjectRecommendation,
      { analysisId: 22 },
    );
    expect(result).toEqual(
      expect.objectContaining({
        analysisId: 22,
        jobTitle: 'Backend Engineer',
      }),
    );
  });

  it('rolls back and releases the query runner when persistence fails', async () => {
    const error = new Error('database failed');
    queryRunner.manager.findOne.mockResolvedValue(null);
    queryRunner.manager.save.mockRejectedValue(error);

    await expect(
      service.saveAnalysis(5, 'Backend Engineer', 'Acme', analysisResponse),
    ).rejects.toThrow(error);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
