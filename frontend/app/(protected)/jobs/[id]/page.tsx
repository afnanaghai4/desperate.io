import JobAnalysisLayout from "@/components/job/job-analysis-layout";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobsPage({ params }: JobPageProps) {
  const { id } = await params;
  const jobId = Number(id);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound();
  }

  let response: Response;
  let data;

  try {
    const cookieStore = await cookies();
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
    });
  } catch (err) {
    console.error("Error fetching job:", err);
    throw err;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403 || response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    console.error(`API error: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch job: ${response.statusText}`);
  }

  try {
    data = await response.json();
  } catch (err) {
    console.error("Error parsing job response:", err);
    throw err;
  }

  if (!data || !data.data) {
    notFound();
  }

  return (
    <JobAnalysisLayout
      mode="ANALYZE"
      jobData={data.data}
      analysisData={data.analysis || undefined}
    />
  );
}
