import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from 'src/entities/job.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async createJob(createJobDto: CreateJobDto, userId: number): Promise<Job> {
    const job = this.jobRepository.create({
      ...createJobDto,
      userId,
    });

    return this.jobRepository.save(job);
  }

  async getJobsByUserId(
    userId: number,
    skip: number = 0,
    take: number = 10,
  ): Promise<{
    jobs: (Job & { hasAnalysis: boolean })[];
    hasMore: boolean;
    totalCount: number;
  }> {
    // Get total count for this user
    const totalCount = await this.jobRepository.count({
      where: { userId },
    });

    // Fetch with LEFT JOIN to check if analysis exists
    const result = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoin('analyses', 'analysis', 'analysis.jobId = job.jobId')
      .where('job.userId = :userId', { userId })
      .orderBy('job.createdAt', 'DESC')
      .addOrderBy('job.jobId', 'DESC')
      .skip(skip)
      .take(take + 1)
      .select([
        'job.jobId',
        'job.userId',
        'job.inputType',
        'job.jobTitle',
        'job.jobText',
        'job.jobLink',
        'job.companyName',
        'job.createdAt',
      ])
      .addSelect('(analysis."analysisId" IS NOT NULL)::boolean', 'hasAnalysis')
      .getRawAndEntities();

    // If we got more than requested, there are more pages
    const hasMore = result.entities.length > take;

    // Map entities with hasAnalysis boolean
    const jobsWithAnalysis = result.entities
      .slice(0, take)
      .map((job, index) => ({
        ...job,
        hasAnalysis:
          (result.raw[index] as Record<string, boolean>).hasAnalysis === true,
      }));

    return {
      jobs: jobsWithAnalysis,
      hasMore,
      totalCount,
    };
  }

  async getJobById(jobId: number, userId: number): Promise<Job | null> {
    return this.jobRepository.findOne({
      where: { jobId, userId },
    });
  }

  async deleteJob(jobId: number, userId: number): Promise<void> {
    const deleteResult = await this.jobRepository.delete({ jobId, userId });

    if (deleteResult.affected === 0) {
      throw new NotFoundException('Job not found or not authorized to delete');
    }
  }
}
