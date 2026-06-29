import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AiOrchestratorModule } from 'src/ai-orchestrator/ai-orchestrator.module';
import { Job } from 'src/entities/job.entity';
import { Analysis } from 'src/entities/analysis.entity';
import { ProjectRecommendation } from 'src/entities/project-recommendation.entity';
import { JobLinkExtractorService } from './job-link-extractor.service';

@Module({
  imports: [
    AiOrchestratorModule,
    TypeOrmModule.forFeature([Job, Analysis, ProjectRecommendation]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, JobLinkExtractorService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
