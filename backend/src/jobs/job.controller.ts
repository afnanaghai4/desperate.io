import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { Request } from 'express';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job } from 'src/entities/job.entity';
import { JobService } from './job.service';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
}
