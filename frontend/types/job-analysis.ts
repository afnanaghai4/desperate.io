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
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
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
