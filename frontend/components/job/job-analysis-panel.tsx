"use client";

import { JobAnalysisResponse, Milestone, ProjectRecommendationResponse } from '@/types/job-analysis';
import { useState } from 'react';

type JobAnalysisPanelProps = {
  analysisResult: JobAnalysisResponse | null;
  isLoading: boolean;
  error?: string | null;
};



export default function JobAnalysisPanel({ analysisResult, isLoading, error }: JobAnalysisPanelProps) {

  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  


  
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-fit lg:sticky lg:top-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLoading ? "Processing..." : "Your personalized insights"}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="relative py-16">
          <div className="blur-sm pointer-events-none select-none space-y-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
              </div>
              <p className="text-gray-600 text-sm font-medium">Analyzing your job posting...</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !analysisResult && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No analysis yet. Click &quot;Analyze&quot; to get started.</p>
        </div>
      )}

      {!isLoading && analysisResult && (
        <div className="space-y-6">
          {/* Metrics Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Job Match Score</span>
                <span className="text-2xl font-bold text-blue-600">{analysisResult.matchPercentage}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-in-out"
                  style={{ width: `${analysisResult.matchPercentage ?? 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Matched Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult?.extractedKeywords?.matchedKeywords && analysisResult.extractedKeywords.matchedKeywords.length > 0 ? (
                  <>
                    {analysisResult.extractedKeywords.matchedKeywords.slice(0, 5).map((keyword: string) => (
                      <span key={keyword} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                        {keyword}
                      </span>
                    ))}
                    {analysisResult.extractedKeywords.matchedKeywords.length > 5 && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                        +{analysisResult.extractedKeywords.matchedKeywords.length - 5} more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500 text-xs">No keywords matched.</span>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended Projects ({analysisResult?.projectRecommendations?.length ?? 0})
            </h3>
            <div className="space-y-3">
              {analysisResult?.projectRecommendations && analysisResult.projectRecommendations.length > 0 ? (
                analysisResult.projectRecommendations.map((project: ProjectRecommendationResponse, index: number) => (
                  <ProjectCard 
                    key={index} 
                    project={project} 
                    index={index}
                    isExpanded={expandedCard === index}
                    onToggle={() => setExpandedCard(expandedCard === index ? null : index)}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No project recommendations available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectRecommendationResponse;  // Use real type from job-analysis types
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProjectCard({ project, isExpanded, onToggle }: ProjectCardProps) {
  const difficultyColors: Record<string, string> = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
  };
  const difficultyColor = difficultyColors[project.difficultyLevel] || 'bg-gray-100 text-gray-800';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between text-left"
      >
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">{project.title}</h4>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${difficultyColor}`}>
              {project.difficultyLevel}
            </span>
            <span className="text-xs text-gray-600">⏱️ {project.timeline}</span>
            <span className="text-xs font-semibold text-green-600">📊 {project.updatedInterviewPercentage}%</span>
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-600 transition-transform duration-700 ease-in-out ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      <div className={`px-4 bg-white space-y-4 transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'border-t border-gray-200 py-4 opacity-100 max-h-[2000px] visible' : 'py-0 opacity-0 max-h-0 invisible'}`}>
          <div>
            <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Description</h5>
            <p className="text-sm text-gray-700">{project.description}</p>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Skills Required</h5>
            <div className="flex flex-wrap gap-1">
              {project.skills.map((skill: string, idx: number) => (
                <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Project Timeline & Milestones</h5>
            <div className="space-y-0 divide-y divide-gray-200">
              {project.milestones.map((milestone: Milestone, idx: number) => (
                <MilestoneItem key={idx} milestone={milestone} />
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">CV Points</h5>
            <ul className="space-y-1">
              {project.cvPoints.map((point: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">{project.updatedInterviewPercentage}%</span> interview match after completion
            </p>
          </div>
        </div>
    </div>
  );
}

interface MilestoneItemProps {
  milestone: Milestone;  // Use real type from job-analysis types
}

function MilestoneItem({ milestone }: MilestoneItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-gray-900">{milestone.week}</span>
        </div>
        <svg className={`w-4 h-4 text-gray-600 transition-transform duration-700 ease-in-out ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      <div className={`border-t border-gray-200 px-3 py-2 bg-white space-y-2 text-xs transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'opacity-100 max-h-[1000px] visible' : 'opacity-0 max-h-0 invisible'}`}>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Tasks:</p>
            <ul className="space-y-1 ml-2">
              {milestone.tasks.map((task: string, taskIdx: number) => (
                <li key={taskIdx} className="text-gray-700">- {task}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Deliverable:</p>
            <p className="text-gray-700 ml-2">{milestone.deliverable}</p>
          </div>
        </div>
    </div>
  );
}
