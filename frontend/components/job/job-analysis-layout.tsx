"use client";

import { JobAnalysisResponse } from "@/types/job-analysis";
import JobForm from './job-form';
import JobAnalysisPanel from './job-analysis-panel';
import { useState } from "react";


export default function JobAnalysisLayout() {
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasAnalysis = analysisResult || isLoading;

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Analysis</h1>
        <p className="text-gray-600 mt-2">Submit a job posting for AI-powered analysis and personalized project recommendations</p>
      </div>

      {/* Grid animates between 2-column and 3-column layout */}
      <div className={`grid gap-6 transition-all duration-700 ease-in-out ${
        hasAnalysis ? "lg:grid-cols-3" : "lg:grid-cols-2"
      } grid-cols-1`}>
        
        {/* Left side - Form (fixed width during animation) */}
        <div className="transition-all duration-700 ease-in-out">
          <JobForm 
          onLoadingStart={() => setIsLoading(true)}
          onAnalysisComplete={(data: JobAnalysisResponse) => {
            setAnalysisResult(data);
            setIsLoading(false);
          }}
          onError={(err: string) => {
            console.error("Error during analysis:", err);
            setIsLoading(false);
          }}
          />
        </div>
        
        {/* Right side - Results (expands when analyzing) */}
        <div className={`transition-all duration-700 ease-in-out ${
          hasAnalysis ? "lg:col-span-2" : "lg:col-span-1"
        }`}>
          <JobAnalysisPanel analysisResult={analysisResult} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}


