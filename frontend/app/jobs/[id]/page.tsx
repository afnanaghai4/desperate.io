import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobAnalysisLayout from "@/components/job/job-analysis-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";


interface JobPageProps {
  params: Promise<{id: string}>
}

export default async function JobsPage({ params }: JobPageProps) {

  const { id } = await params;
  const jobId  = parseInt(id);
  
  let data;
  try {
    const cookieStore = await cookies();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieStore.toString(),
      },
    });

    if (!response.ok) {
      notFound();
    }

    data = await response.json();
    if (!data || !data.data) {
      notFound();
    }
  } catch (err) {
    console.error('Error fetching job:', err);
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <JobAnalysisLayout 
          mode="ANALYZE"
          jobData={data.data}
          analysisData={data.analysis || undefined}
        />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
