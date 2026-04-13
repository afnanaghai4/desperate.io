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
  ): Promise<Job[]> {
    return this.jobRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }
}
