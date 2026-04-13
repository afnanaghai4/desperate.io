import Link from "next/link";

export default function DashboardWidgets() {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Welcome</h2>
        <p className="mt-2 text-sm text-gray-600">
          Start building your personalized project flow from here.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your latest generated results and actions will appear here.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="mt-2 text-sm text-gray-600 mb-4">
          Analyze a new job posting to get recommendations.
        </p>
        <Link
          href="/jobs"
          className="inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Submit Job Posting
        </Link>
      </div>
    </section>
  );
}