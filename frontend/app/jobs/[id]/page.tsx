import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobAnalysisLayout from "@/components/job/job-analysis-layout";
import ProtectedRoute from "@/components/auth/protected-route";

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <JobAnalysisLayout />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}