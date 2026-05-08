import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DashboardContent from "@/components/dashboard/dashboard-content";
import ProtectedRoute from "@/components/auth/protected-route";
import ProfileGuard from "@/components/auth/profile-guard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ProfileGuard>
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Navbar />
          <DashboardContent />
          <Footer />
        </div>
      </ProfileGuard>
    </ProtectedRoute>
  );
}