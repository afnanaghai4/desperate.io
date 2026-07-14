"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import JobAnalysisLayout from "@/components/job/job-analysis-layout";
import { getJobById, GetJobResponse } from "@/lib/job-api";
import { isApiErrorStatus } from "@/lib/api";

interface JobDetailPageContentProps {
  jobId: number;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; jobId: number; data: GetJobResponse }
  | { status: "not-found"; jobId: number }
  | { status: "error"; jobId: number; message: string };

export default function JobDetailPageContent({ jobId }: JobDetailPageContentProps) {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  const fetchJob = useCallback(async (requestId: number) => {
    try {
      const data = await getJobById(jobId);
      if (requestId !== requestIdRef.current) {
        return;
      }

      setLoadState({ status: "ready", jobId, data });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (isApiErrorStatus(error, [401])) {
        router.replace("/login");
        return;
      }

      if (isApiErrorStatus(error, [403, 404])) {
        setLoadState({ status: "not-found", jobId });
        return;
      }

      const message = error instanceof Error ? error.message : "Unable to load this saved job.";
      setLoadState({ status: "error", jobId, message });
    }
  }, [jobId, router]);

  const loadJob = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadState({ status: "loading" });
    await fetchJob(requestId);
  }, [fetchJob]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void fetchJob(requestId);

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchJob]);

  if (loadState.status === "loading" || loadState.jobId !== jobId) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <p className="text-lg text-gray-600">Loading saved job...</p>
      </main>
    );
  }

  if (loadState.status === "not-found") {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Saved job not found</h1>
          <p className="mt-2 text-gray-600">
            This job may have been deleted, or you may not have access to it.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Back to saved jobs
          </Link>
        </div>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-semibold text-red-900">Unable to load saved job</h1>
          <p className="mt-2 text-red-700">{loadState.message}</p>
          <button
            type="button"
            onClick={() => void loadJob()}
            className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <JobAnalysisLayout
      mode="ANALYZE"
      jobData={loadState.data.data}
      analysisData={loadState.data.analysis || undefined}
    />
  );
}
