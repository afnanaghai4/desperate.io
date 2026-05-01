import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobAnalysisLayout from "@/components/job/job-analysis-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";


interface JobPageProps {
  params: Promise<{id: string}>
}

export default async function JobsPage({ params }: JobPageProps) {

  const { id } = await params;
  const jobId = parseInt(id);
  
  // Validate jobId is a valid number
  if (isNaN(jobId)) {
    notFound();
  }
  
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

    // Handle auth failures - redirect to login
    if (response.status === 401) {
      redirect('/login');
    }

    // Handle authorization failures - forbidden
    if (response.status === 403) {
      notFound();
    }

    // Handle not found
    if (response.status === 404) {
      notFound();
    }

    // Handle server errors - log and show error state
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch job: ${response.statusText}`);
    }

    data = await response.json();
    if (!data || !data.data) {
      notFound();
    }
  } catch (err) {
    // Log actual errors but don't mask them as 404
    console.error('Error fetching job:', err);
    // Re-throw to let Next.js error boundary handle it
    throw err;
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
