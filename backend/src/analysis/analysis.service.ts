import { Injectable } from '@nestjs/common';
import { Analysis } from 'src/entities/analysis.entity';
import { ProjectRecommendation } from 'src/entities/project-recommendation.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { JobAnalysisResponse } from '../ai-orchestrator/ai-orchestrator.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
    @InjectRepository(ProjectRecommendation)
    private readonly projectRecommendationRepository: Repository<ProjectRecommendation>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
    // Use a transaction to ensure all-or-nothing persistence
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch existing analysis within transaction
      let analysis = await queryRunner.manager.findOne(Analysis, {
        where: { jobId },
      });

      if (!analysis) {
        analysis = queryRunner.manager.create(Analysis, {
          jobId,
          jobTitle: jobTitle || '',
          companyName,
          strongPoints: analysisResponse.analysis.strengths,
          weakPoints: analysisResponse.analysis.weaknesses,
          baselineInterviewChancePercent: analysisResponse.matchPercentage,
          extractedKeywords: analysisResponse.extractedKeywords,
        });
      } else {
        analysis.jobTitle = jobTitle || '';
        analysis.companyName = companyName;
        analysis.strongPoints = analysisResponse.analysis.strengths;
        analysis.weakPoints = analysisResponse.analysis.weaknesses;
        analysis.baselineInterviewChancePercent =
          analysisResponse.matchPercentage;
        analysis.extractedKeywords = analysisResponse.extractedKeywords;
      }

      // Save or update the analysis entity
      const savedAnalysis = await queryRunner.manager.save(Analysis, analysis);

      // Delete existing project recommendations if updating
      if (savedAnalysis.analysisId) {
        await queryRunner.manager.delete(ProjectRecommendation, {
          analysisId: savedAnalysis.analysisId,
        });
      }

      // Create and save new project recommendations
      if (
        analysisResponse.projectRecommendations &&
        analysisResponse.projectRecommendations.length > 0
      ) {
        const projectRecommendations =
          analysisResponse.projectRecommendations.map((rec, index) =>
            queryRunner.manager.create(ProjectRecommendation, {
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

        await queryRunner.manager.save(ProjectRecommendation, projectRecommendations);
      }

      await queryRunner.commitTransaction();
      return savedAnalysis;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
