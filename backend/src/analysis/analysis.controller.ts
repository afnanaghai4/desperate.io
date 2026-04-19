// analysis.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AiOrchestratorService } from '../ai-orchestrator/ai-orchestrator.service';
import {
  AnalyzeJobFitRequest,
  JobAnalysisResponse,
} from '../ai-orchestrator/ai-orchestrator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job } from '../entities/job.entity';

interface AuthRequest extends ExpressRequest {
  user: { userId: number; email: string };
}

@Controller('analysis')
export class AnalysisController {
  constructor(
    private aiOrchestratorService: AiOrchestratorService,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  @Post('analyze-fit')
  @UseGuards(JwtAuthGuard)
  async analyzeFit(
    @Body() body: { jobId: number },
    @Request() req: AuthRequest,
  ): Promise<JobAnalysisResponse> {
    if (!body.jobId) {
      throw new BadRequestException('jobId is required');
    }

    // Fetch the job
    const job = await this.jobRepository.findOne({
      where: { jobId: body.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get job description (either from jobText or jobLink)
    let jobDescription = '';
    if (job.jobText) {
      jobDescription = job.jobText;
    } else if (job.jobLink) {
      jobDescription = job.jobLink;
    } else {
      throw new BadRequestException('Job has no description or link');
    }

    // Call the service with userId and jobDescription
    const request: AnalyzeJobFitRequest = {
      userId: req.user.userId,
      jobDescription,
    };

    return this.aiOrchestratorService.analyzeJobFit(request);
  }
}
