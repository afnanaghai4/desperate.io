"use client";

type Props = {
  loading?: boolean;
};

export default function JobSubmitButton({
  loading = false,
}: Props) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-label={loading ? "Submitting job analysis" : "Submit job analysis"}
      aria-busy={loading}
      className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Submitting..." : "Save Job"}
    </button>
  );
}