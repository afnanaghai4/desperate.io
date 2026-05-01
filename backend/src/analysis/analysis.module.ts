import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AiOrchestratorModule } from 'src/ai-orchestrator/ai-orchestrator.module';
import { Job } from 'src/entities/job.entity';
import { Analysis } from 'src/entities/analysis.entity';
import { ProjectRecommendation } from 'src/entities/project-recommendation.entity';

@Module({
  imports: [
    AiOrchestratorModule,
    TypeOrmModule.forFeature([Job, Analysis, ProjectRecommendation]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
