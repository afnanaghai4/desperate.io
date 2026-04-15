import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobsPageContent from "@/components/job/jobs-page-content";
import ProtectedRoute from "@/components/auth/protected-route";

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <JobsPageContent />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}