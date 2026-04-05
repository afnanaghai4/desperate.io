import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProfileContainer from "@/components/profile/profile-container";
import ProtectedRoute from "@/components/auth/protected-route";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <ProfileContainer />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}