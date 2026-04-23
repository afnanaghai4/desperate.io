import { apiFetch } from "./api";

import {Job, InputType} from "@/types/job";
import { JobAnalysisResponse } from "@/types/job-analysis";


export interface CreateJobPayload {
    companyName?: string;
    inputType: InputType;
    jobTitle?: string;
    jobLink?: string | null;
    jobText?: string | null;
}


export interface CreateJobResponse {
    message: string;
    data: {
        jobId: number;        
        userId: number;
        inputType: InputType;
        jobTitle: string | null;
        jobText: string | null;
        jobLink: string | null;
        companyName: string | null;
        createdAt: string;  // JSON response arrives as ISO string, not Date object
        };
    }


export async function createJob(
    payload: CreateJobPayload
): Promise<CreateJobResponse> {
    return apiFetch<CreateJobResponse>('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getJobs(skip: number = 0, take: number = 10): Promise<{ jobs: Job[]; hasMore: boolean; totalCount: number; totalPages: number }> {
    return apiFetch<{ message: string; data: Job[]; hasMore: boolean; totalCount: number; totalPages: number }>(`/jobs?skip=${skip}&take=${take}`)
        .then(response => ({
            jobs: response.data,
            hasMore: response.hasMore,
            totalCount: response.totalCount,
            totalPages: response.totalPages,
        }));
}

export async function analyzeJob(jobId: number): Promise<JobAnalysisResponse> {
    return apiFetch<JobAnalysisResponse>('/analysis/analyze-fit', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
    });
}

export async function deleteJob(jobId: number): Promise<void> {
        return apiFetch<void>(`/jobs/${jobId}`, {
            method: 'DELETE',
        });
}