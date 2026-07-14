import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JobDetailPageContent from "./job-detail-page-content";
import { ApiError } from "@/lib/api";
import { getJobById, GetJobResponse } from "@/lib/job-api";
import { Job } from "@/types/job";
import { JobAnalysisResponse } from "@/types/job-analysis";

const { replaceMock, routerMock } = vi.hoisted(() => {
  const replace = vi.fn();

  return {
    replaceMock: replace,
    routerMock: {
      replace,
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/job/job-analysis-layout", () => ({
  default: vi.fn(({ jobData, analysisData }) => (
    <section>
      <h1>Mock Job Analysis Layout</h1>
      <p>{jobData.jobTitle}</p>
      <p>{analysisData ? "Has analysis" : "No analysis"}</p>
    </section>
  )),
}));

vi.mock("@/lib/job-api", () => ({
  getJobById: vi.fn(),
}));

const getJobByIdMock = vi.mocked(getJobById);

const job: Job = {
  jobId: 42,
  userId: 9,
  inputType: "TEXT",
  jobTitle: "Frontend Engineer",
  companyName: "Acme",
  jobText: "Build accessible React interfaces.",
  jobLink: null,
  createdAt: "2026-05-12T10:00:00.000Z",
};

const analysis: JobAnalysisResponse = {
  matchPercentage: 81,
  extractedKeywords: {
    jobKeywords: ["React"],
    profileKeywords: ["React"],
    matchedKeywords: ["React"],
  },
  analysis: {
    strengths: ["React"],
    weaknesses: ["Cloud"],
  },
  projectRecommendations: [],
};

const response: GetJobResponse = {
  message: "Job fetched successfully",
  data: job,
  analysis,
};

describe("JobDetailPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and renders the selected saved job", async () => {
    getJobByIdMock.mockResolvedValue(response);

    render(<JobDetailPageContent jobId={42} />);

    expect(screen.getByText("Loading saved job...")).toBeInTheDocument();
    expect(await screen.findByText("Mock Job Analysis Layout")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Has analysis")).toBeInTheDocument();
    expect(getJobByIdMock).toHaveBeenCalledWith(42);
  });

  it("redirects unauthenticated users to login", async () => {
    getJobByIdMock.mockRejectedValue(new ApiError("Unauthorized", 401));

    render(<JobDetailPageContent jobId={42} />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });

  it("shows a not found state when the saved job cannot be accessed", async () => {
    getJobByIdMock.mockRejectedValue(new ApiError("Not found", 404));

    render(<JobDetailPageContent jobId={42} />);

    expect(await screen.findByRole("heading", { name: "Saved job not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to saved jobs" })).toHaveAttribute("href", "/jobs");
  });

  it("shows a not found state when the saved job belongs to another user", async () => {
    getJobByIdMock.mockRejectedValue(new ApiError("Forbidden", 403));

    render(<JobDetailPageContent jobId={42} />);

    expect(await screen.findByRole("heading", { name: "Saved job not found" })).toBeInTheDocument();
    expect(screen.getByText("This job may have been deleted, or you may not have access to it.")).toBeInTheDocument();
  });

  it("shows a retry action when loading fails", async () => {
    const user = userEvent.setup();
    getJobByIdMock.mockRejectedValueOnce(new Error("Network failure")).mockResolvedValueOnce(response);

    render(<JobDetailPageContent jobId={42} />);

    expect(await screen.findByRole("heading", { name: "Unable to load saved job" })).toBeInTheDocument();
    expect(screen.getByText("Network failure")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Mock Job Analysis Layout")).toBeInTheDocument();
    expect(getJobByIdMock).toHaveBeenCalledTimes(2);
  });
});
