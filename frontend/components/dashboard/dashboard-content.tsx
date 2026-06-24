import DashboardWidgets from "@/components/dashboard/dashboard-widgets";

export default function DashboardContent() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-8 md:py-10">
      <div className="w-full">
        <DashboardWidgets />
      </div>
    </main>
  );
}
