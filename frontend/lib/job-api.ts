import { apiFetch } from "./api";

import {Job, InputType} from "@/types/job";


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

export async function getJobs(skip: number = 0, take: number = 10): Promise<{ jobs: Job[]; hasMore: boolean }> {
    return apiFetch<{ message: string; data: Job[]; hasMore: boolean }>(`/jobs?skip=${skip}&take=${take}`)
        .then(response => ({
            jobs: response.data,
            hasMore: response.hasMore,
        }));
}