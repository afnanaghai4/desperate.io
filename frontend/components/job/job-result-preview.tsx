"use client";

import { InputType } from "@/lib/job-api";


type JobResult = {
  jobId: number;
  userId: number;
  jobTitle?: string | null;
  companyName?: string | null;
  inputType: InputType;
  createdAt: string;  // Always a string from JSON response
};

type Props = {
  result: JobResult | null;
};

export default function JobResultPreview({ result }: Props) {
  if (!result) return null;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" role="status" aria-live="polite">
      <h3 className="text-lg font-semibold mb-4">
        Submission Successful
      </h3>

      <div className="space-y-2 text-sm text-gray-700">
        <p>
          <span className="font-medium">Job ID:</span>{" "}
          {result.jobId}
        </p>

        {result.jobTitle && (
          <p>
            <span className="font-medium">Title:</span>{" "}
            {result.jobTitle}
          </p>
        )}

        {result.companyName && (
          <p>
            <span className="font-medium">Company:</span>{" "}
            {result.companyName}
          </p>
        )}

        <p>
          <span className="font-medium">Input Type:</span>{" "}
          {result.inputType}
        </p>

        {result.createdAt && (
          <p>
            <span className="font-medium">Created:</span>{" "}
            {new Date(result.createdAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}