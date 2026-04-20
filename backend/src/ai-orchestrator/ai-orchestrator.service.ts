import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DifficultyLevel } from '../common/enums/difficulty-level.enum';
import { UsersService } from '../users/users.service';

// USER INPUT RESPONSES //

export interface UserExperienceDto {
  currentPosition?: string;
  company?: string;
  experience?: string;
  skills?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
}

export interface AnalyzeJobFitRequest {
  userId: number;
  jobDescription: string;
}

// OPENAI RESPONSE SCHEMA //

export interface Milestone {
  week: string;
  tasks: string[];
  deliverable: string;
}

export interface ExtractedKeywords {
  jobKeywords: string[];
  profileKeywords: string[];
  matchedKeywords: string[];
}

export interface StrengthWeakPointsAnalysis {
  strengths: string[];
  weaknesses: string[];
}

export interface ProjectRecommendationResponse {
  title: string;
  description: string;
  timeline: string;
  difficultyLevel: DifficultyLevel;
  skills: string[];
  milestones: Milestone[];
  cvPoints: string[];
  updatedInterviewPercentage: number;
}

export interface JobAnalysisResponse {
  matchPercentage: number;
  extractedKeywords: ExtractedKeywords;
  analysis: StrengthWeakPointsAnalysis;
  projectRecommendations: ProjectRecommendationResponse[];
}

@Injectable()
export class AiOrchestratorService {
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  private getOpenAiClient(): OpenAI {
    if (!this.openai) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  private validateInputs(request: AnalyzeJobFitRequest): void {
    if (!request) {
      throw new Error('Request body is required.');
    }

    // Enforce userId is a finite, positive integer (blocks NaN, Infinity, decimals)
    if (
      typeof request.userId !== 'number' ||
      !Number.isFinite(request.userId) ||
      !Number.isInteger(request.userId) ||
      request.userId <= 0
    ) {
      throw new Error('Invalid or missing userId (must be a positive integer)');
    }
    if (!request.jobDescription || typeof request.jobDescription !== 'string') {
      throw new Error('Invalid or missing jobDescription');
    }

    const jobtrimmed = request.jobDescription.trim();

    // Reject URL-only jobs (URLs must be actual job text, not just links)
    const urlPattern = /^https?:\/\/.+$/i;
    if (urlPattern.test(jobtrimmed)) {
      throw new Error(
        'Job description cannot be a URL only. Please provide the actual job posting text.',
      );
    }

    if (jobtrimmed.length < 50) {
      throw new Error(
        'Job description is too short. Please provide a more detailed description.',
      );
    }

    if (jobtrimmed.length > 10000) {
      throw new Error(
        'Job description is too long. Please limit to 10,000 characters.',
      );
    }
    // Removed: Overly aggressive character filter that blocked common job posting characters
    // like | ("Senior | Lead Engineer"), {} (template placeholders), \\ (Windows paths),
    // and <> (HTML/XML snippets). Job text validation handled by length checks.
  }

  private validateUserProfile(experiences: UserExperienceDto[]): void {
    // Ensure user has at least one experience entry
    if (!Array.isArray(experiences) || experiences.length === 0) {
      throw new Error(
        'User profile must have at least one experience entry to analyze job fit.',
      );
    }

    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];

      // Validate element is an object (catches null, primitives like 42 or null)
      if (typeof exp !== 'object' || exp === null) {
        throw new Error(
          `Experience at index ${i + 1}: invalid entry (must be an object)`,
        );
      }

      // Validate skills is a non-empty string
      if (typeof exp.skills !== 'string' || exp.skills.trim().length === 0) {
        throw new Error(
          `Experience at index ${i + 1}: skills must be a non-empty string`,
        );
      }
    }
  }

  private validateJobAnalysisResponse(
    data: unknown,
  ): data is JobAnalysisResponse {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Validate matchPercentage (0-100)
    if (
      typeof obj.matchPercentage !== 'number' ||
      obj.matchPercentage < 0 ||
      obj.matchPercentage > 100
    ) {
      return false;
    }

    // Validate extractedKeywords
    if (!this.isValidExtractedKeywords(obj.extractedKeywords)) {
      return false;
    }

    // Validate analysis (strengths & weaknesses)
    if (!this.isValidAnalysis(obj.analysis)) {
      return false;
    }

    // Validate projectRecommendations (should be 3-4 projects)
    if (
      !Array.isArray(obj.projectRecommendations) ||
      obj.projectRecommendations.length < 3 ||
      obj.projectRecommendations.length > 4
    ) {
      return false;
    }

    for (const project of obj.projectRecommendations) {
      if (!this.isValidProjectRecommendation(project)) {
        return false;
      }
    }

    return true;
  }

  private isValidExtractedKeywords(data: unknown): data is ExtractedKeywords {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const keywords = data as Record<string, unknown>;

    // Validate jobKeywords (at least 1, all non-empty strings)
    if (
      !Array.isArray(keywords.jobKeywords) ||
      keywords.jobKeywords.length === 0 ||
      !keywords.jobKeywords.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    // Validate profileKeywords (at least 1, all non-empty strings)
    if (
      !Array.isArray(keywords.profileKeywords) ||
      keywords.profileKeywords.length === 0 ||
      !keywords.profileKeywords.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    // Validate matchedKeywords (can be 0 or more, all non-empty strings)
    if (
      !Array.isArray(keywords.matchedKeywords) ||
      !keywords.matchedKeywords.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    return true;
  }

  private isValidAnalysis(data: unknown): data is StrengthWeakPointsAnalysis {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const analysis = data as Record<string, unknown>;

    // Validate strengths (at least 1, all non-empty strings)
    if (
      !Array.isArray(analysis.strengths) ||
      analysis.strengths.length === 0 ||
      !analysis.strengths.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    // Validate weaknesses (at least 1, all non-empty strings)
    if (
      !Array.isArray(analysis.weaknesses) ||
      analysis.weaknesses.length === 0 ||
      !analysis.weaknesses.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    return true;
  }

  private isValidProjectRecommendation(
    data: unknown,
  ): data is ProjectRecommendationResponse {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const project = data as Record<string, unknown>;

    // Validate title (non-empty string)
    if (
      typeof project.title !== 'string' ||
      project.title.trim().length === 0
    ) {
      return false;
    }

    // Validate description (non-empty string)
    if (
      typeof project.description !== 'string' ||
      project.description.trim().length === 0
    ) {
      return false;
    }

    // Validate timeline (non-empty string, e.g., "3-4 weeks", "4 days")
    if (
      typeof project.timeline !== 'string' ||
      project.timeline.trim().length === 0
    ) {
      return false;
    }

    // Validate difficultyLevel (must be BEGINNER, INTERMEDIATE, or ADVANCED)
    if (
      !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(
        project.difficultyLevel as string,
      )
    ) {
      return false;
    }

    // Validate skills (at least 1 skill, all non-empty strings)
    if (
      !Array.isArray(project.skills) ||
      project.skills.length === 0 ||
      !project.skills.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    // Validate milestones (at least 1 milestone)
    if (!Array.isArray(project.milestones) || project.milestones.length === 0) {
      return false;
    }

    for (const milestone of project.milestones) {
      if (!this.isValidMilestone(milestone)) {
        return false;
      }
    }

    // Validate cvPoints (at least 1 point, all non-empty strings)
    if (
      !Array.isArray(project.cvPoints) ||
      project.cvPoints.length === 0 ||
      !project.cvPoints.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    // Validate updatedInterviewPercentage (0-100, must be number)
    if (
      typeof project.updatedInterviewPercentage !== 'number' ||
      project.updatedInterviewPercentage < 0 ||
      project.updatedInterviewPercentage > 100
    ) {
      return false;
    }

    return true;
  }

  private isValidMilestone(data: unknown): data is Milestone {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const milestone = data as Record<string, unknown>;

    // Validate week (non-empty string, e.g., "Week 1", "Week 2-3")
    if (
      typeof milestone.week !== 'string' ||
      milestone.week.trim().length === 0
    ) {
      return false;
    }

    // Validate tasks (at least 1 task, all non-empty strings)
    if (
      !Array.isArray(milestone.tasks) ||
      milestone.tasks.length === 0 ||
      !milestone.tasks.every(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    ) {
      return false;
    }

    // Validate deliverable (non-empty string)
    if (
      typeof milestone.deliverable !== 'string' ||
      milestone.deliverable.trim().length === 0
    ) {
      return false;
    }

    return true;
  }

  private buildSystemPrompt(): string {
    return `You are a career coach analyzing job fit for software engineers.
You specialize in identifying skill gaps, assessing career alignment, and recommending learning projects.
Return ONLY valid JSON with no additional text, markdown, or explanations.
No preamble, no comments, just JSON.`;
  }

  private buildUserPrompt(
    experiences: UserExperienceDto[],
    jobDescription: string,
  ): string {
    let prompt = 'Candidate Profile:\n\n';

    for (const exp of experiences) {
      prompt += 'Experience Entry:\n';
      prompt += `Position: ${exp.currentPosition || 'not specified'}\n`;
      prompt += `Company: ${exp.company || 'not specified'}\n`;
      prompt += `Experience: ${exp.experience || 'not specified'}\n`;
      prompt += `Skills: ${exp.skills || 'not specified'}\n`;
      prompt += `Start Date: ${exp.startDate || 'not specified'}\n`;
      prompt += `End Date: ${exp.endDate || 'not specified'}\n`;
      prompt += `Currently Working: ${
        exp.currentlyWorking === true
          ? 'Yes'
          : exp.currentlyWorking === false
            ? 'No'
            : 'not specified'
      }\n\n`;
      prompt += '\n';
    }

    prompt += `\nJOB DESCRIPTION:\n###\n${jobDescription}\n###\n`;

    prompt += `\nYOUR ANALYSIS TASK:

1. Extract Keywords:
   - Identify 8-10 keywords from the job description
   - Identify 5-7 matching keywords from candidate's profile
   - Find keywords present in BOTH

2. Calculate Match Percentage:
   - Consider skill overlap, experience level, and years of experience
   - Return a percentage (0-100) representing interview likelihood

3. Identify Strengths & Weaknesses:
   - List 3-4 existing strengths matching the job
   - List 3-4 gaps to address

4. Recommend Projects (3-4 projects):
   For EACH project provide:
   - Title and description
   - Timeline (e.g., "3-4 weeks", "4 days")
   - Difficulty Level: must be exactly BEGINNER, INTERMEDIATE, or ADVANCED
   - Skills this project teaches
   - 4-6 detailed milestones with weekly tasks and deliverables
   - 3-4 CV points (quantifiable achievements like "Achieved 50% performance improvement")
   - Updated interview percentage after completing this project

CRITICAL: Return ONLY valid JSON in this exact format:
{
  "matchPercentage": number (0-100),
  "extractedKeywords": {
    "jobKeywords": string[],
    "profileKeywords": string[],
    "matchedKeywords": string[]
  },
  "analysis": {
    "strengths": string[],
    "weaknesses": string[]
  },
  "projectRecommendations": [
    {
      "title": string,
      "description": string,
      "timeline": string,
      "difficultyLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      "skills": string[],
      "milestones": [
        {
          "week": string,
          "tasks": string[],
          "deliverable": string
        }
      ],
      "cvPoints": string[],
      "updatedInterviewPercentage": number
    }
  ]
}`;
    return prompt;
  }

  private async callOpenAiModel(
    experiences: UserExperienceDto[],
    jobDescription: string,
  ): Promise<JobAnalysisResponse> {
    const model = this.configService.get<string>('OPENAI_MODEL');

    if (!model) {
      throw new Error('OPENAI_MODEL environment variable is not set');
    }

    const openai = this.getOpenAiClient();

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(experiences, jobDescription);

    try {
      const response = await openai.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' },
          max_tokens: 4000,
        },
        {
          timeout: 45_000, // 45 second timeout
        },
      );

      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI response is missing choices');
      }

      const message = response.choices[0].message;
      if (!message) {
        throw new Error('OpenAI response message is missing');
      }

      const content = message.content;
      if (!content) {
        throw new Error('OpenAI response content is empty');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse OpenAI response as JSON: ${errorMsg}`);
      }

      if (!this.validateJobAnalysisResponse(parsed)) {
        console.error(
          'Validation failed. Response structure:',
          JSON.stringify(parsed, null, 2),
        );
        throw new Error(
          'OpenAI response JSON does not match expected JobAnalysisResponse schema',
        );
      }

      return parsed;
    } catch (err) {
      if (err instanceof Error) {
        console.error('OpenAI API error:', err.message);

        if (err.message.includes('429')) {
          throw new Error(
            'OpenAI API rate limit exceeded. Please try again later.',
          );
        }

        if (err.message.includes('401')) {
          throw new Error(
            'OpenAI API authentication error. Please check your API key.',
          );
        }

        if (
          err.message.includes('timeout') ||
          err.message.includes('Timeout')
        ) {
          throw new Error('OpenAI API timeout. Please try again later.');
        }
      }

      throw err;
    }
  }

  async analyzeJobFit(
    request: AnalyzeJobFitRequest,
  ): Promise<JobAnalysisResponse> {
    try {
      // Step 1: Validate request parameters (userId, jobDescription)
      this.validateInputs(request);

      // Step 2: Fetch user profile from database
      const user = await this.usersService.findById(request.userId);
      if (!user) {
        throw new Error('User profile not found');
      }

      // Step 3: Extract experiences from user profile (with null checks)
      const experiences: UserExperienceDto[] =
        user.profileDetails &&
        typeof user.profileDetails === 'object' &&
        Array.isArray(user.profileDetails.experiences)
          ? (user.profileDetails.experiences as UserExperienceDto[])
          : [];

      // Step 4: Validate user profile data (experiences must have skills)
      this.validateUserProfile(experiences);

      // Step 5: Call OpenAI with profile + job description (using normalized/trimmed version)
      // This combines buildSystemPrompt, buildUserPrompt, and calls OpenAI API
      const normalizedJobDescription = request.jobDescription.trim();
      const analysisResult = await this.callOpenAiModel(
        experiences,
        normalizedJobDescription,
      );

      // Step 6: Return validated result to frontend
      return analysisResult;
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof Error) {
        console.error('analyzeJobFit error:', error.message);
        throw error;
      }

      throw new Error('Failed to analyze job fit');
    }
  }
}
