import DashboardWidgets from "@/components/dashboard/dashboard-widgets";

export default function DashboardContent() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-8">
      <div className="w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your project recommendations, activity, and next steps.
          </p>
        </div>

        <DashboardWidgets />
      </div>
    </main>
  );
}