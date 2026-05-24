"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Gauge,
  Sparkles,
  UserRound,
} from "lucide-react";

import { getJobs } from "@/lib/job-api";
import { getProfile, type UserProfile } from "@/lib/users-api";
import { type Job } from "@/types/job";

type DashboardDataState = {
  jobs: Job[];
  totalCount: number;
  profile: UserProfile | null;
};

const profileFields = [
  "Full name",
  "Phone",
  "Address",
  "Experience",
  "Current position",
  "Company",
  "Skills",
] as const;

function getProfileCompletion(profile: UserProfile | null) {
  if (!profile) {
    return { completed: 0, total: profileFields.length, percent: 0 };
  }

  const experiences = Array.isArray(profile.experiences)
    ? profile.experiences
    : [];
  const hasExperience = experiences.length > 0;
  const hasValue = (value?: string) => Boolean(value?.trim());
  const hasExperienceValue = (
    field: "currentPosition" | "company" | "skills"
  ) => experiences.some((experience) => hasValue(experience[field]));

  const checks = [
    hasValue(profile.personalInfo?.fullName),
    hasValue(profile.personalInfo?.phone),
    hasValue(profile.personalInfo?.address),
    hasExperience,
    hasExperienceValue("currentPosition"),
    hasExperienceValue("company"),
    hasExperienceValue("skills"),
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;
  const percent = Math.round((completed / total) * 100);

  return { completed, total, percent };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function DashboardWidgets() {
  const [data, setData] = useState<DashboardDataState>({
    jobs: [],
    totalCount: 0,
    profile: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoading(true);
      setJobsError(null);
      setProfileError(null);

      const [jobsResult, profileResult] = await Promise.allSettled([
        getJobs(0, 3),
        getProfile(),
      ]);

      if (!isMounted) {
        return;
      }

      if (jobsResult.status === "fulfilled") {
        const jobsResponse = jobsResult.value;
        setData((prev) => ({
          ...prev,
          jobs: Array.isArray(jobsResponse.jobs) ? jobsResponse.jobs : [],
          totalCount: jobsResponse.totalCount || 0,
        }));
      } else {
        const message =
          jobsResult.reason instanceof Error
            ? jobsResult.reason.message
            : "Unable to load recent jobs.";
        setJobsError(message);
      }

      if (profileResult.status === "fulfilled") {
        const profileResponse = profileResult.value;
        setData((prev) => ({
          ...prev,
          profile: profileResponse.data.profileDetails,
        }));
      } else {
        const message =
          profileResult.reason instanceof Error
            ? profileResult.reason.message
            : "Profile progress is unavailable right now.";
        setProfileError(message);
      }

      setIsLoading(false);
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const profileCompletion = getProfileCompletion(data.profile);
  const analyzedJobs = data.jobs.filter((job) => job.hasAnalysis).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              AI-guided job fit workflow
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Build proof for the roles you actually want.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Add a target job, compare it against your profile, and use the
              recommendations to plan portfolio projects that close the gap.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Analyze a Job
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                View Saved Jobs
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-600">Workspace summary</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryMetric
                label="Saved jobs"
                value={isLoading ? "..." : String(data.totalCount)}
              />
              <SummaryMetric
                label="Recent analyses"
                value={isLoading ? "..." : String(analyzedJobs)}
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Quick actions" className="grid gap-6 md:grid-cols-3">
        <ActionCard
          href="/jobs/create"
          icon={<FileText aria-hidden="true" className="h-5 w-5" />}
          title="Add a target job"
          description="Paste a posting or save a job link before running analysis."
        />
        <ActionCard
          href="/jobs"
          icon={<Gauge aria-hidden="true" className="h-5 w-5" />}
          title="Review analyses"
          description="Return to saved jobs and continue from existing fit results."
        />
        <ActionCard
          href="/profile"
          icon={<UserRound aria-hidden="true" className="h-5 w-5" />}
          title="Improve your profile"
          description="Keep your skills and experience current for better matches."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCompletionCard
          completed={profileCompletion.completed}
          total={profileCompletion.total}
          percent={profileCompletion.percent}
          isLoading={isLoading}
          error={profileError}
        />
        <RecentJobsCard
          jobs={data.jobs}
          isLoading={isLoading}
          error={jobsError}
        />
      </section>

      <section
        aria-label="Recommended workflow"
        className="grid gap-4 md:grid-cols-4"
      >
        <WorkflowStep
          step="1"
          title="Profile"
          description="Keep your work history and skills ready."
        />
        <WorkflowStep
          step="2"
          title="Target"
          description="Save the job posting you want to pursue."
        />
        <WorkflowStep
          step="3"
          title="Analyze"
          description="Compare requirements against your profile."
        />
        <WorkflowStep
          step="4"
          title="Build"
          description="Use project recommendations as your roadmap."
        />
      </section>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow"
    >
      <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        {icon}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-700"
        />
      </div>
    </Link>
  );
}

function ProfileCompletionCard({
  completed,
  total,
  percent,
  isLoading,
  error,
}: {
  completed: number;
  total: number;
  percent: number;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Profile readiness
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            A fuller profile gives the analyzer better context for matching
            skills, experience, and project gaps.
          </p>
        </div>
        <ClipboardCheck
          aria-hidden="true"
          className="h-6 w-6 shrink-0 text-green-600"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading profile progress...</p>
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Profile progress is unavailable right now.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {completed} of {total} fields completed
              </span>
              <span className="text-xl font-bold text-gray-900">
                {percent}%
              </span>
            </div>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200"
              aria-label={`Profile ${percent}% complete`}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        )}
      </div>

      <Link
        href="/profile"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Update Profile
      </Link>
    </section>
  );
}

function RecentJobsCard({
  jobs,
  isLoading,
  error,
}: {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent jobs</h2>
          <p className="mt-2 text-sm text-gray-600">
            Pick up from your latest saved targets.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          View All
        </Link>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            Loading recent jobs...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Unable to load recent jobs. {error}
          </div>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-900">
              No jobs saved yet
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Add your first target job to unlock analysis and project
              recommendations.
            </p>
            <Link
              href="/jobs/create"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create Job
            </Link>
          </div>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.jobId}
                href={`/jobs/${job.jobId}`}
                className="block rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {job.jobTitle || "Untitled Job"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {job.companyName || "No company"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {job.hasAnalysis && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Analyzed
                      </span>
                    )}
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {job.inputType}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Saved {formatDate(job.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function WorkflowStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
        {step}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}
