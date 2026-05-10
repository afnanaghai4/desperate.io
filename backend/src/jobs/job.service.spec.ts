import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { InputType } from '../common/enums/input-type.enum';
import { Job } from '../entities/job.entity';
import { JobService } from './job.service';

type MockRepository<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('JobService', () => {
  let service: JobService;
  let jobRepository: MockRepository<Job>;

  beforeEach(async () => {
    jobRepository = createMockRepository<Job>();

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

  it('lists a user jobs with pagination metadata', async () => {
    const jobs = [
      { jobId: 3, userId: 10 },
      { jobId: 2, userId: 10 },
      { jobId: 1, userId: 10 },
    ] as Job[];

    jobRepository.count?.mockResolvedValue(3);
    jobRepository.find?.mockResolvedValue(jobs);

    const result = await service.getJobsByUserId(10, 0, 2);

    expect(jobRepository.count).toHaveBeenCalledWith({
      where: { userId: 10 },
    });
    expect(jobRepository.find).toHaveBeenCalledWith({
      where: { userId: 10 },
      order: { createdAt: 'DESC', jobId: 'DESC' },
      skip: 0,
      take: 3,
    });
    expect(result).toEqual({
      jobs: jobs.slice(0, 2),
      hasMore: true,
      totalCount: 3,
    });
  });

  it('returns hasMore false when no extra job is fetched', async () => {
    const jobs = [{ jobId: 1, userId: 10 }] as Job[];

    jobRepository.count?.mockResolvedValue(1);
    jobRepository.find?.mockResolvedValue(jobs);

    const result = await service.getJobsByUserId(10, 0, 10);

    expect(result).toEqual({
      jobs,
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
