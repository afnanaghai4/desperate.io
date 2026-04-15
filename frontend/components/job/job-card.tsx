"use client";

import { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  onView?: (jobId: number) => void;
  onDelete?: (jobId: number) => void;
}

export default function JobCard({ job, onView, onDelete }: JobCardProps) {
  const inputTypeBadgeColor = job.inputType === "TEXT" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-900">{job.jobTitle || "Untitled Job"}</h3>
        <span className={`text-xs ${inputTypeBadgeColor} px-3 py-1 rounded-full`}>
          {job.inputType}
        </span>
      </div>
      <p className="text-gray-700 font-semibold mb-2">{job.companyName || "No company"}</p>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {job.inputType === "TEXT" ? job.jobText : job.jobLink}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onView?.(job.jobId)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded transition"
        >
          View
        </button>
        <button 
          onClick={() => onDelete?.(job.jobId)}
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
