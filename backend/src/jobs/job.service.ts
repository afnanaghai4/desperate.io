import { Injectable } from '@nestjs/common';
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
  ): Promise<{ jobs: Job[]; hasMore: boolean; totalCount: number }> {
    // Get total count for this user
    const totalCount = await this.jobRepository.count({
      where: { userId },
    });

    // Fetch take+1 to determine if more exists
    const jobs = await this.jobRepository.find({
      where: { userId },
      order: { createdAt: 'DESC', jobId: 'DESC' }, // Deterministic: tie-breaker with jobId
      skip,
      take: take + 1,
    });

    // If we got more than requested, there are more pages
    const hasMore = jobs.length > take;

    // Return only the requested amount
    return {
      jobs: jobs.slice(0, take),
      hasMore,
      totalCount,
    };
  }

  async deleteJob(jobId: number, userId: number): Promise<void> {
    const deleteResult = await this.jobRepository.delete({ jobId, userId });

    if (deleteResult.affected === 0) {
      throw new Error('Job not found or not authorized to delete');
    }
  }
}
