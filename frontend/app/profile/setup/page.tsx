import Footer from "@/components/layout/footer";
import ProfileSetupContainer from "@/components/profile/profile-setup-container";
import ProtectedRoute from "@/components/auth/protected-route";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <ProfileSetupContainer />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}