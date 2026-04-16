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

@Injectable()
export class AiOrchestratorService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async extractJobMetadata(jobDescription: string): Promise<JobAnalysisResult> {
    const model = this.configService.get<string>('OPENAI_MODEL');
    if (!model) {
      throw new Error('OPENAI_MODEL environment variable is not set');
    }

    const prompt = `Analyze this job description and extract the following information in JSON format:
- roleDirection: (e.g., "Backend", "Frontend", "Full-stack", "DevOps", "Data Engineering")
- seniority: (e.g., "Junior", "Mid-level", "Senior", "Lead")
- domain: (e.g., "Finance", "Healthcare", "E-commerce", "SaaS")
- skills: (array of technical skills, e.g., ["TypeScript", "Node.js"])
- tools: (array of tools/platforms, e.g., ["Git", "Docker", "Kubernetes"])
- cloudPlatforms: (array of cloud platforms, e.g., ["AWS", "Google Cloud", "Azure"])
- databases: (array of databases, e.g., ["PostgreSQL", "MongoDB", "Redis"])
- frameworks: (array of frameworks, e.g., ["React", "NestJS", "Django"])

Job Description:
${jobDescription}

Return ONLY valid JSON, no additional text.`;

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content) as JobAnalysisResult;
    return result;
  }
}
