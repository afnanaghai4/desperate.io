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
import { AnalysisService } from './analysis.service';
import { validateJobDescriptionForAnalysis } from '../common/validation/job-description.validation';

interface AuthRequest extends ExpressRequest {
  user: { userId: number; email: string };
}

@Controller('analysis')
export class AnalysisController {
  constructor(
    private aiOrchestratorService: AiOrchestratorService,
    private analysisService: AnalysisService,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  @Post('analyze-fit')
  @UseGuards(JwtAuthGuard)
  async analyzeFit(
    @Body() body: { jobId: number },
    @Request() req: AuthRequest,
  ): Promise<{ message: string; data: JobAnalysisResponse }> {
    if (!body.jobId) {
      throw new BadRequestException('jobId is required');
    }

    if (!req.user || typeof req.user.userId !== 'number') {
      throw new BadRequestException('User context is invalid or missing');
    }

    // Fetch only jobs owned by the authenticated user.
    const job = await this.jobRepository.findOne({
      where: { jobId: body.jobId, userId: req.user.userId },
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

    validateJobDescriptionForAnalysis(jobDescription);

    const request: AnalyzeJobFitRequest = {
      userId: req.user.userId,
      jobDescription,
    };

    const analysisResponse =
      await this.aiOrchestratorService.analyzeJobFit(request);

    // Save the analysis to the database
    await this.analysisService.saveAnalysis(
      body.jobId,
      job.jobTitle,
      job.companyName,
      analysisResponse,
    );

    return {
      message: 'Job analysis completed successfully',
      data: analysisResponse,
    };
  }
}
