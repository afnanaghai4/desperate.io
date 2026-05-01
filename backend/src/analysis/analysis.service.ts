import { Injectable } from '@nestjs/common';
import { Analysis } from 'src/entities/analysis.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JobAnalysisResponse } from '../ai-orchestrator/ai-orchestrator.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
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

    return this.analysisRepository.save(analysis);
  }
}
