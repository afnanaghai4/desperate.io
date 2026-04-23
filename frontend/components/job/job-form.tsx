"use client";


import { useState } from "react";
import { InputType, Job } from "@/types/job";
import { analyzeJob, createJob } from "@/lib/job-api";
import { JobAnalysisResponse } from "@/types/job-analysis";
import  JobSubmitButton from './job-submit-button'
import JobInputToggle from './job-input-toggle';
import InputField from "../ui/input-field";
import JobAnalyzeButton from "./job-analyze-button";

interface JobFormProps {
  onLoadingStart: () => void;
  onAnalysisComplete: (data: JobAnalysisResponse) => void;
  onAnalysisError: (err: string) => void;
  onClearAnalysis: () => void;
}

export default function JobForm({onLoadingStart, onAnalysisComplete, onAnalysisError, onClearAnalysis}: JobFormProps) {

  const [inputType, setInputType] = useState<InputType>("TEXT");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobText, setJobText] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Job | null>(null);
  const [isJobSaved, setIsJobSaved] = useState(false);
  
  const conditionalresetFields = (type: InputType) => {
    if (type === 'TEXT') {
      setJobLink("");
    } else {
      setJobText("");
    }
  };

  const handleInputTypeChange = (type: InputType) => {
    setInputType(type);
    setError(null);
    setResult(null);
    conditionalresetFields(type);
  }


  const validateForm = (): string | null => {
    
    if (inputType === "TEXT") {
      const trimmedText = jobText.trim();

      if(!trimmedText || trimmedText.length < 10){
      return "Job description must be at least 10 characters long.";
    }
  }

    if (inputType === "LINK") {
      const trimmedLink = jobLink.trim();

      if (!trimmedLink) {
        return "Job link is required.";
      }
}
  return null;
  } 

    

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if(loading){
      return;
  }

    setError(null);
    setResult(null);
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const payload = {
      inputType,
      jobTitle: jobTitle.trim() || undefined,
      jobText: inputType === "TEXT" ? jobText.trim() : undefined,
      jobLink: inputType === "LINK" ? jobLink.trim() : undefined,
      companyName: companyName.trim() || undefined,
    }

    try {
      const response = await createJob(payload);
      setResult(response.data);
      setIsJobSaved(true);
    
    } catch(err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
}


  const handleAnalyzeClick = async () => {
    if(loading || !result){
      return;
    }
    setLoading(true);
    onLoadingStart();
    try {
      const analysis = await analyzeJob(result.jobId);
      onAnalysisComplete(analysis);
    } catch(err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during analysis.";
      setError(errorMessage);
      onAnalysisError(errorMessage);
    } finally {
      setLoading(false);
    }
  }
  
  const handleReset = () => {
    setCompanyName("");
    setJobTitle("");
    setJobLink("");
    setJobText("");
    setInputType("TEXT");
    setIsJobSaved(false);
    setResult(null);
    setError(null);
    onClearAnalysis();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-fit">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Job Details</h2>
        <p className="mt-2 text-sm text-gray-600">Enter job information for analysis</p>
      </div>

      <div className="space-y-5">
        <JobInputToggle value={inputType} onChange={handleInputTypeChange} />

        <InputField
          id="companyName"
          label="Company Name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Optional"
          disabled={loading || isJobSaved}
        />

        <InputField
          id="jobTitle"
          label="Job Title"
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Optional"
          disabled={loading || isJobSaved}
        />

        {inputType === "TEXT" ? (
          <div>
            <label htmlFor="jobText" className="mb-2 block text-sm font-medium text-gray-700">
              Job Description
            </label>
            <textarea
              id="jobText"
              rows={10}
              placeholder="Paste the full job description here"
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              disabled={loading || isJobSaved}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p className="mt-2 text-xs text-gray-500">Minimum 10 characters.</p>
          </div>
        ) : (
          <InputField
            id="jobLink"
            label="Job Link"
            type="url"
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
            placeholder="https://example.com/job"
            disabled={loading || isJobSaved}
          />
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!isJobSaved ? (
            <>
              <JobSubmitButton loading={loading} />
            </>
          ) : (
            <>
              <JobAnalyzeButton onClick={handleAnalyzeClick} loading={loading} />
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "New Job"}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

