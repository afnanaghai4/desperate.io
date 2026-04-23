"use client";

type Props = {
  loading?: boolean;
  onClick: () => void;
};

export default function JobAnalyzeButton({
  loading = false,
  onClick,
}: Props) {

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      aria-label={loading ? "Analyzing job description" : "Analyze job description"}
      aria-busy={loading}
      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition disabled:cursor-not-allowed"
    >
      {loading ? "Analyzing..." : "Analyze Job"}
    </button>
  );
}