"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import JobsList from "./jobs-list";
import {Job} from "@/types/job";
import {getJobs} from "@/lib/job-api";


export default function JobsPageContent() {

    const[jobs, setJobs] = useState<Job[]>([]);
    const[isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 6; 
    const skip = (currentPage - 1) * pageSize;
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const fetchJobs = async () => {
            try {
                setIsLoading(true);
                console.log('📥 Fetching jobs...')
                const { jobs: fetchedJobs, totalPages: apiTotalPages } = await getJobs(skip, pageSize);

                // Check if this request was aborted
                if (abortControllerRef.current?.signal.aborted) {
                    console.log('Request was cancelled, ignoring response');
                    return;
                }

                if(!fetchedJobs || fetchedJobs.length === 0) {
                    setJobs([]);
                    setTotalPages(1);
                    setIsLoading(false);
                    return;
                }

                setJobs(fetchedJobs);
                setTotalPages(apiTotalPages);
                setIsLoading(false);

            } catch (err) {
                // Ignore abort errors
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                
                const errorMsg = err instanceof Error ? err.message : 'Failed to fetch jobs';
                console.error('❌ Error loading jobs:', errorMsg);
                setJobs([]);
                setTotalPages(1);
                setIsLoading(false);
            }
        }
        
        fetchJobs();
    }, [skip, currentPage]);




    return (
    <main className="flex-1 container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-600 mt-2">Manage and track all your job postings</p>
        </div>
        <Link
          href="/jobs/create"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          + Create New Job
        </Link>
      </div>

        <JobsList
        jobs = {Array.isArray(jobs) ? jobs : []}
        currentPage={currentPage}
        isLoading={isLoading}
        onPreviousPage={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNextPage={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        totalPages={totalPages}
        onView={(jobId) => {
            console.log('View job:', jobId);
            // TODO: Implement view job functionality
        }}
        onDelete={(jobId) => {
            console.log('Delete job:', jobId);
            // TODO: Implement delete job functionality
        }}
        />
      {/* Jobs List Component - Add your logic here */}
      {/* <JobsList jobs={jobs} currentPage={currentPage} totalPages={totalPages} ... /> */}
    </main>
  );
}
