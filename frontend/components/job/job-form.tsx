"use client";

import { useState } from 'react';
import InputField from "../ui/input-field";
import JobInputToggle from './job-input-toggle';
import JobSubmitButton from './job-submit-button';
import JobResultPreview from './job-result-preview';
import { createJob } from '@/lib/job-api';
import { InputType } from '@/types/job';

type JobFormData = {
    jobId: number;
    userId: number;
    jobTitle: string | null;
    companyName: string | null;
    inputType: InputType;
    jobText: string | null;
    jobLink: string | null;
    createdAt: string;  // JSON response arrives as ISO string, not Date object
};

export default function JobForm() {
    const [inputType, setInputType] = useState<InputType>("TEXT");
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobText, setJobText] = useState('');
    const [jobLink, setJobLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<JobFormData | null>(null);
    
    const conditionalResetField = (type: InputType) => {
        if (type === "TEXT") {
            setJobLink("");
        } else {
            setJobText("");
        }
    }    
    
    const handleInputTypeChange = (type: InputType) => {
        setInputType(type);
        setError(null);
        setResult(null);
        conditionalResetField(type);
    };

    const validateForm = (): string | null => {
        if(inputType === "TEXT") {
            const trimmedText = jobText.trim()

            if(!trimmedText) {
                return "Job description is required"
            }
            
            if(trimmedText.length < 10) {
                return "Job description must be at least 10 characters"
            }
        }

        if(inputType === "LINK") {
            const trimmedLink = jobLink.trim();

            if(!trimmedLink) {
                return "Job link is required"
            }

        }
        return null;
        }

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Guard against duplicate submissions while one is in-flight
        if (loading) {
            return;
        }
        
        setError(null);
        setResult(null);  // Clear stale success result before new attempt
        setLoading(true);
        
        const validationError = validateForm();
        if(validationError) {
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
            setResult(response.data)
            setCompanyName("");
            setJobTitle("");
            setJobText("");
            setJobLink("");
            setInputType("TEXT");  
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred while submitting the job";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Job Analysis
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Paste a job description or provide a job link to start the
          analysis flow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <JobInputToggle value={inputType} onChange={handleInputTypeChange} />

        <InputField 
            id="companyName"
            label="Company Name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Optional"
        />
        <InputField
            id="jobTitle"
            label="Job Title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Optional"
        />

        {inputType === "TEXT" ? (
          <div>
            <label
              htmlFor="jobText"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Job Description
            </label>
            <textarea
              id="jobText"
              name="jobText"
              rows={10}
              placeholder="Paste the full job description here"
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Minimum 10 characters.
            </p>
          </div>
            ) : (
            <InputField
              id="jobLink"
              label="Job Link"
              type="url"
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder="https://example.com/job"
              disabled={loading}
            />
          )}
            {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        <JobSubmitButton loading={loading} />
      </form>

      <JobResultPreview result={result} />
    </div>
  );

}

