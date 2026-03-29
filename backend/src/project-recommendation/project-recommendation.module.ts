import { Module } from '@nestjs/common';
import { ProjectRecommendationService } from './project-recommendation.service';
import { ProjectRecommendationController } from './project-recommendation.controller';

@Module({
  controllers: [ProjectRecommendationController],
  providers: [ProjectRecommendationService],
  exports: [ProjectRecommendationService],
})
export class ProjectRecommendationModule {}
