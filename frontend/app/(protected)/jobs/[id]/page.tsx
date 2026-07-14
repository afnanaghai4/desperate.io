import JobDetailPageContent from "@/components/job/job-detail-page-content";
import { notFound } from "next/navigation";

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobsPage({ params }: JobPageProps) {
  const { id } = await params;
  const jobId = Number(id);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound();
  }

  return <JobDetailPageContent jobId={jobId} />;
}
