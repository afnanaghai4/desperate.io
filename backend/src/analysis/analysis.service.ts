import { Injectable } from '@nestjs/common';
import { Analysis } from 'src/entities/analysis.entity';
import { ProjectRecommendation } from 'src/entities/project-recommendation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JobAnalysisResponse } from '../ai-orchestrator/ai-orchestrator.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
    @InjectRepository(ProjectRecommendation)
    private readonly projectRecommendationRepository: Repository<ProjectRecommendation>,
  ) {}

  async getAnalysisByJobId(jobId: number): Promise<Analysis | null> {
    return this.analysisRepository.findOne({
      where: { jobId },
      relations: ['projectRecommendations'],
    });
  }

  async saveAnalysis(
    jobId: number,
    jobTitle: string | null,
    companyName: string | null,
    analysisResponse: JobAnalysisResponse,
  ): Promise<Analysis> {
    let analysis = await this.analysisRepository.findOne({
      where: { jobId },
    });

    if (!analysis) {
      analysis = this.analysisRepository.create({
        jobId,
        jobTitle: jobTitle || '',
        companyName,
        strongPoints: analysisResponse.analysis.strengths,
        weakPoints: analysisResponse.analysis.weaknesses,
        baselineInterviewChancePercent: analysisResponse.matchPercentage,
      });
    } else {
      analysis.jobTitle = jobTitle || '';
      analysis.companyName = companyName;
      analysis.strongPoints = analysisResponse.analysis.strengths;
      analysis.weakPoints = analysisResponse.analysis.weaknesses;
      analysis.baselineInterviewChancePercent =
        analysisResponse.matchPercentage;
    }

    // Save or update the analysis entity first
    const savedAnalysis = await this.analysisRepository.save(analysis);

    // Delete existing project recommendations if updating
    if (analysis.analysisId) {
      await this.projectRecommendationRepository.delete({
        analysisId: analysis.analysisId,
      });
    }

    // Create and save new project recommendations
    if (
      analysisResponse.projectRecommendations &&
      analysisResponse.projectRecommendations.length > 0
    ) {
      const projectRecommendations =
        analysisResponse.projectRecommendations.map((rec, index) =>
          this.projectRecommendationRepository.create({
            analysisId: savedAnalysis.analysisId,
            title: rec.title,
            description: rec.description,
            difficultyLevel: rec.difficultyLevel,
            timeline: rec.timeline,
            skills: rec.skills,
            milestones: rec.milestones,
            cvPoints: rec.cvPoints,
            improvedInterviewChancePercent: rec.updatedInterviewPercentage,
            displayOrder: index,
          }),
        );

      await this.projectRecommendationRepository.save(projectRecommendations);
    }

    return savedAnalysis;
  }
}
