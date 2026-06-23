import JobAnalysisLayout from "@/components/job/job-analysis-layout";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobsPage({ params }: JobPageProps) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    notFound();
  }

  let data;
  try {
    const cookieStore = await cookies();
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
    });

    if (response.status === 401) {
      redirect("/login");
    }

    if (response.status === 403) {
      notFound();
    }

    if (response.status === 404) {
      notFound();
    }

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch job: ${response.statusText}`);
    }

    data = await response.json();
    if (!data || !data.data) {
      notFound();
    }
  } catch (err) {
    console.error("Error fetching job:", err);
    throw err;
  }

  return (
    <JobAnalysisLayout
      mode="ANALYZE"
      jobData={data.data}
      analysisData={data.analysis || undefined}
    />
  );
}
