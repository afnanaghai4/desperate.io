import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobForm from "@/components/job/job-form";
import ProtectedRoute from "@/components/auth/protected-route";

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <JobForm />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}