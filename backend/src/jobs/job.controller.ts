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
  Delete,
  Param,
  NotFoundException,
} from '@nestjs/common';

import { Request as expressRequest } from 'express';
import { CreateJobDto } from './dto/create-job.dto';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job } from 'src/entities/job.entity';
import { JobService } from './job.service';
import { ValidateJobInputPipe } from './dto/pipes/validate-job-input.pipe';
import { AnalysisService } from '../analysis/analysis.service';
import {
  JobAnalysisResponse,
  ProjectRecommendationResponse,
} from '../ai-orchestrator/ai-orchestrator.service';

interface AuthRequest extends expressRequest {
  user: { userId: number; email: string };
}

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly analysisService: AnalysisService,
  ) {}

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
  ): Promise<{
    message: string;
    data: Job[];
    hasMore: boolean;
    totalCount: number;
    totalPages: number;
  }> {
    const result = await this.jobService.getJobsByUserId(
      req.user.userId,
      query.skip,
      query.take,
    );

    // Calculate total pages (use nullish coalescing for default)
    const totalPages = Math.ceil(result.totalCount / (query.take ?? 10));

    return {
      message: 'Jobs retrieved successfully',
      data: result.jobs,
      hasMore: result.hasMore,
      totalCount: result.totalCount,
      totalPages,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getJobById(
    @Request() req: AuthRequest,
    @Param('id') jobId: number,
  ): Promise<{
    message: string;
    data: Job;
    analysis: JobAnalysisResponse | null;
  }> {
    const result = await this.jobService.getJobById(jobId, req.user.userId);
    const analysisEntity = await this.analysisService.getAnalysisByJobId(jobId);
    if (!result) {
      throw new NotFoundException('Job not found or not authorized to view');
    }

    // Map Analysis entity to JobAnalysisResponse format
    let analysisResponse: JobAnalysisResponse | null = null;
    if (analysisEntity) {
      analysisResponse = {
        matchPercentage: analysisEntity.baselineInterviewChancePercent,
        extractedKeywords: {
          jobKeywords: [],
          profileKeywords: [],
          matchedKeywords: [],
        },
        analysis: {
          strengths: analysisEntity.strongPoints || [],
          weaknesses: analysisEntity.weakPoints || [],
        },
        projectRecommendations:
          (analysisEntity.projectRecommendations as unknown as ProjectRecommendationResponse[]) ||
          [],
      };
    }

    return {
      message: 'Job and possible analysis retrieved successfully',
      data: result,
      analysis: analysisResponse || null,
    };
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteJob(
    @Req() req: AuthRequest,
    @Param('id') jobId: number,
  ): Promise<{ message: string }> {
    await this.jobService.deleteJob(jobId, req.user.userId);
    return {
      message: 'Job deleted successfully',
    };
  }
}
