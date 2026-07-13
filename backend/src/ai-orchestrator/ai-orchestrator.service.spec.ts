import { AiOrchestratorService } from './ai-orchestrator.service';

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;

  beforeEach(() => {
    service = new AiOrchestratorService({} as never, {} as never);
  });

  it('accepts an empty strengths list for low-match analysis responses', () => {
    const response = {
      matchPercentage: 20,
      extractedKeywords: {
        jobKeywords: ['AI services', 'NLP'],
        profileKeywords: ['node', 'typescript'],
        matchedKeywords: [],
      },
      analysis: {
        strengths: [],
        weaknesses: ['No Python experience'],
      },
      projectRecommendations: [
        {
          title: 'Basic NLP with Python',
          description: 'Build a text classification app.',
          timeline: '4 weeks',
          difficultyLevel: 'INTERMEDIATE',
          skills: ['Python', 'NLP'],
          milestones: [
            {
              week: '1',
              tasks: ['Set up Python environment'],
              deliverable: 'Environment ready',
            },
          ],
          cvPoints: ['Built an NLP text classification app'],
          updatedInterviewPercentage: 30,
        },
      ],
    };

    expect(
      (
        service as unknown as {
          validateJobAnalysisResponse(data: unknown): boolean;
        }
      ).validateJobAnalysisResponse(response),
    ).toBe(true);
  });

  it('accepts an empty weaknesses list for high-match analysis responses', () => {
    const response = {
      matchPercentage: 100,
      extractedKeywords: {
        jobKeywords: ['nestjs'],
        profileKeywords: ['nestjs'],
        matchedKeywords: ['nestjs'],
      },
      analysis: {
        strengths: ['Strong NestJS experience'],
        weaknesses: [],
      },
      projectRecommendations: [],
    };

    expect(
      (
        service as unknown as {
          validateJobAnalysisResponse(data: unknown): boolean;
        }
      ).validateJobAnalysisResponse(response),
    ).toBe(true);
  });
});
