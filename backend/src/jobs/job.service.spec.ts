import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { InputType } from '../common/enums/input-type.enum';
import { Job } from '../entities/job.entity';
import { JobService } from './job.service';

type MockRepository<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

type MockQueryBuilder = {
  leftJoin: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  getRawAndEntities: jest.Mock;
};

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('JobService', () => {
  let service: JobService;
  let jobRepository: MockRepository<Job>;
  let queryBuilder: MockQueryBuilder;

  const selectedJobFields = [
    'job.jobId',
    'job.userId',
    'job.inputType',
    'job.jobTitle',
    'job.jobText',
    'job.jobLink',
    'job.companyName',
    'job.createdAt',
  ];

  beforeEach(async () => {
    jobRepository = createMockRepository<Job>();
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn(),
    };
    jobRepository.createQueryBuilder?.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: getRepositoryToken(Job),
          useValue: jobRepository,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function expectJobsQuery(skip: number, take: number, userId = 10) {
    expect(jobRepository.count).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(jobRepository.createQueryBuilder).toHaveBeenCalledWith('job');
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'analyses',
      'analysis',
      'analysis.jobId = job.jobId',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('job.userId = :userId', {
      userId,
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('job.jobId', 'DESC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(skip);
    expect(queryBuilder.take).toHaveBeenCalledWith(take + 1);
    expect(queryBuilder.select).toHaveBeenCalledWith(selectedJobFields);
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      '(analysis."analysisId" IS NOT NULL)::boolean',
      'hasAnalysis',
    );
  }

  it('creates a TEXT job for the authenticated user', async () => {
    const dto = {
      inputType: InputType.TEXT,
      jobTitle: 'Backend Engineer',
      companyName: 'Acme',
      jobText: 'Build reliable APIs with NestJS and PostgreSQL.',
    };
    const createdJob = { jobId: 1, userId: 42, ...dto };

    jobRepository.create?.mockReturnValue(createdJob);
    jobRepository.save?.mockResolvedValue(createdJob);

    const result = await service.createJob(dto, 42);

    expect(jobRepository.create).toHaveBeenCalledWith({
      ...dto,
      userId: 42,
    });
    expect(jobRepository.save).toHaveBeenCalledWith(createdJob);
    expect(result).toBe(createdJob);
  });

  it('creates a LINK job for the authenticated user', async () => {
    const dto = {
      inputType: InputType.LINK,
      jobTitle: 'Cloud Engineer',
      companyName: 'Acme',
      jobLink: 'https://example.com/jobs/cloud-engineer',
    };
    const createdJob = { jobId: 2, userId: 7, ...dto };

    jobRepository.create?.mockReturnValue(createdJob);
    jobRepository.save?.mockResolvedValue(createdJob);

    const result = await service.createJob(dto, 7);

    expect(jobRepository.create).toHaveBeenCalledWith({
      ...dto,
      userId: 7,
    });
    expect(result).toBe(createdJob);
  });

  it('lists user jobs with hasAnalysis flags and pagination metadata', async () => {
    const jobs = [
      {
        jobId: 3,
        userId: 10,
        inputType: InputType.TEXT,
        jobTitle: 'Newest Backend Role',
        jobText: 'Detailed backend role using NestJS.',
        jobLink: null,
        companyName: 'Acme',
        createdAt: new Date('2026-05-19T12:00:00.000Z'),
      },
      {
        jobId: 2,
        userId: 10,
        inputType: InputType.LINK,
        jobTitle: 'Cloud Role',
        jobText: null,
        jobLink: 'https://example.com/jobs/cloud',
        companyName: 'Globex',
        createdAt: new Date('2026-05-19T11:00:00.000Z'),
      },
      {
        jobId: 1,
        userId: 10,
        inputType: InputType.TEXT,
        jobTitle: 'Extra Role',
        jobText: 'Detailed platform role using PostgreSQL.',
        jobLink: null,
        companyName: 'Initech',
        createdAt: new Date('2026-05-19T10:00:00.000Z'),
      },
    ] as Job[];

    jobRepository.count?.mockResolvedValue(3);
    queryBuilder.getRawAndEntities.mockResolvedValue({
      entities: jobs,
      raw: [
        { hasAnalysis: true },
        { hasAnalysis: false },
        { hasAnalysis: true },
      ],
    });

    const result = await service.getJobsByUserId(10, 0, 2);

    expectJobsQuery(0, 2);
    expect(result).toEqual({
      jobs: [
        {
          ...jobs[0],
          hasAnalysis: true,
        },
        {
          ...jobs[1],
          hasAnalysis: false,
        },
      ],
      hasMore: true,
      totalCount: 3,
    });
  });

  it('returns hasMore false when no extra job is fetched', async () => {
    const jobs = [{ jobId: 1, userId: 10 }] as Job[];

    jobRepository.count?.mockResolvedValue(1);
    queryBuilder.getRawAndEntities.mockResolvedValue({
      entities: jobs,
      raw: [{ hasAnalysis: false }],
    });

    const result = await service.getJobsByUserId(10, 0, 10);

    expectJobsQuery(0, 10);
    expect(result).toEqual({
      jobs: [
        {
          ...jobs[0],
          hasAnalysis: false,
        },
      ],
      hasMore: false,
      totalCount: 1,
    });
  });

  it('gets a job by id scoped to the authenticated user', async () => {
    const job = { jobId: 5, userId: 11 } as Job;
    jobRepository.findOne?.mockResolvedValue(job);

    const result = await service.getJobById(5, 11);

    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { jobId: 5, userId: 11 },
    });
    expect(result).toBe(job);
  });

  it('deletes a job scoped to the authenticated user', async () => {
    jobRepository.delete?.mockResolvedValue({ affected: 1 });

    await expect(service.deleteJob(8, 12)).resolves.toBeUndefined();

    expect(jobRepository.delete).toHaveBeenCalledWith({
      jobId: 8,
      userId: 12,
    });
  });

  it('throws when deleting a missing or unauthorized job', async () => {
    jobRepository.delete?.mockResolvedValue({ affected: 0 });

    await expect(service.deleteJob(8, 12)).rejects.toThrow(
      'Job not found or not authorized to delete',
    );
  });
});
