import {
  Body,
  Controller,
  Post,
  Request,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  Get,
  Query,
} from '@nestjs/common';

import { Request as expressRequest } from 'express';
import { CreateJobDto } from './dto/create-job.dto';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job } from 'src/entities/job.entity';
import { JobService } from './job.service';
import { ValidateJobInputPipe } from './dto/pipes/validate-job-input.pipe';

interface AuthRequest extends expressRequest {
  user: { userId: number; email: string };
}

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidateJobInputPipe)
  @HttpCode(HttpStatus.CREATED)
  async createJob(
    @Body() createJobDto: CreateJobDto,
    @Req() req: AuthRequest,
  ): Promise<{ message: string; data: Job }> {
    const job = await this.jobService.createJob(createJobDto, req.user.userId);
    return {
      message: 'Job created successfully',
      data: job,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserJobs(
    @Request() req: AuthRequest,
    @Query() query: GetJobsQueryDto,
  ): Promise<{ message: string; data: Job[] }> {
    const jobs = await this.jobService.getJobsByUserId(
      req.user.userId,
      query.skip,
      query.take,
    );
    return {
      message: 'Jobs retrieved successfully',
      data: jobs,
    };
  }
}
