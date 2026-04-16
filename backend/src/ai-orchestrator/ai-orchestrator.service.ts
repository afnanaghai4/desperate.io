import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface JobAnalysisResult {
  roleDirection: string;
  seniority: string;
  domain: string;
  skills: string[];
  tools: string[];
  cloudPlatforms: string[];
  databases: string[];
  frameworks: string[];
}

/**
 * Validates that the parsed JSON matches the expected JobAnalysisResult schema.
 * Ensures type safety and prevents downstream data corruption from malformed responses.
 */
function validateJobAnalysisResult(data: unknown): data is JobAnalysisResult {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Validate required string fields
  if (
    typeof obj.roleDirection !== 'string' ||
    typeof obj.seniority !== 'string' ||
    typeof obj.domain !== 'string'
  ) {
    return false;
  }

  // Validate required array fields - must be arrays of strings
  const arrayFields = [
    'skills',
    'tools',
    'cloudPlatforms',
    'databases',
    'frameworks',
  ];
  for (const field of arrayFields) {
    if (!Array.isArray(obj[field])) {
      return false;
    }
    if (!obj[field].every((item) => typeof item === 'string')) {
      return false;
    }
  }

  return true;
}

@Injectable()
export class AiOrchestratorService {
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {}

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

  async extractJobMetadata(jobDescription: string): Promise<JobAnalysisResult> {
    const model = this.configService.get<string>('OPENAI_MODEL');
    if (!model) {
      throw new Error('OPENAI_MODEL environment variable is not set');
    }

    const openai = this.getOpenAiClient();

    // Separate system instructions from user data to prevent prompt injection
    const systemPrompt = `You are a job analysis assistant. Extract the following information from the job description and return ONLY valid JSON with no additional text.

Required fields:
- roleDirection: (e.g., "Backend", "Frontend", "Full-stack", "DevOps", "Data Engineering")
- seniority: (e.g., "Junior", "Mid-level", "Senior", "Lead")
- domain: (e.g., "Finance", "Healthcare", "E-commerce", "SaaS")
- skills: (array of technical skills, e.g., ["TypeScript", "Node.js"])
- tools: (array of tools/platforms, e.g., ["Git", "Docker", "Kubernetes"])
- cloudPlatforms: (array of cloud platforms, e.g., ["AWS", "Google Cloud", "Azure"])
- databases: (array of databases, e.g., ["PostgreSQL", "MongoDB", "Redis"])
- frameworks: (array of frameworks, e.g., ["React", "NestJS", "Django"])`;

    // Wrap untrusted content with delimiters to prevent injection attacks
    const userMessage = `Analyze the job description delimited by ### below and extract the specified information:

###
${jobDescription}
###`;

    const response = await openai.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        timeout: 30_000, // 30 second timeout to prevent indefinite hangs
      },
    );

    // Safely extract content with guard against empty choices array
    if (!response.choices || response.choices.length === 0) {
      throw new Error(
        'OpenAI returned empty choices array. This may indicate a content filter refusal or API issue.',
      );
    }

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('OpenAI returned a choice without a message');
    }

    const content = message.content;
    if (!content) {
      throw new Error('OpenAI returned an empty message content');
    }

    // Safely parse JSON with error context
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse OpenAI response as JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Validate parsed JSON matches expected schema before returning
    if (!validateJobAnalysisResult(parsed)) {
      throw new Error(
        'OpenAI response does not match expected JobAnalysisResult schema. Missing or malformed required fields.',
      );
    }

    return parsed;
  }
}
