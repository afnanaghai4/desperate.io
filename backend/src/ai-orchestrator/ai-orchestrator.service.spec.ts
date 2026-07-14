import { AiOrchestratorService } from './ai-orchestrator.service';
import type {
  UserEducationDto,
  UserExperienceDto,
} from './ai-orchestrator.service';
import { BadRequestException } from '@nestjs/common';

type AiOrchestratorPrivate = {
  validateUserProfile(
    experiences: UserExperienceDto[],
    educations: UserEducationDto[],
  ): void;
  buildUserPrompt(
    experiences: UserExperienceDto[],
    educations: UserEducationDto[],
    jobDescription: string,
  ): string;
};

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;
  let privateService: AiOrchestratorPrivate;

  beforeEach(() => {
    service = new AiOrchestratorService({} as never, {} as never);
    privateService = service as unknown as AiOrchestratorPrivate;
  });

  it('allows education-only profiles for fresh candidates', () => {
    expect(() =>
      privateService.validateUserProfile(
        [],
        [
          {
            instituteName: 'Example University',
            degreeName: 'BS Computer Science',
            fieldOfStudy: 'Software Engineering',
            startDate: '2022-09',
            currentlyAttending: true,
            description: 'Coursework in TypeScript and databases',
          },
        ],
      ),
    ).not.toThrow();
  });

  it('rejects profiles without experience or education context', () => {
    expect(() => privateService.validateUserProfile([], [])).toThrow(
      new BadRequestException(
        'User profile must have at least one experience or education entry to analyze job fit.',
      ),
    );
  });

  it('keeps validating malformed experience entries even when education exists', () => {
    expect(() =>
      privateService.validateUserProfile(
        [{ currentPosition: 'Backend Intern' }],
        [{ degreeName: 'BS Computer Science' }],
      ),
    ).toThrow(
      new BadRequestException(
        'Experience at index 1: skills must be a non-empty string',
      ),
    );
  });

  it('includes education details in the job analysis prompt', () => {
    const prompt = privateService.buildUserPrompt(
      [],
      [
        {
          instituteName: 'Example University',
          degreeName: 'BS Computer Science',
          fieldOfStudy: 'Software Engineering',
          description: 'Built academic projects with TypeScript and SQL',
        },
      ],
      'Backend role requiring TypeScript and SQL.',
    );

    expect(prompt).toContain('Education Entry:');
    expect(prompt).toContain('Degree: BS Computer Science');
    expect(prompt).toContain('Field of Study: Software Engineering');
    expect(prompt).toContain(
      'Description: Built academic projects with TypeScript and SQL',
    );
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
