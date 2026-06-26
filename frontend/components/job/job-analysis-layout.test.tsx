import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JobAnalysisLayout from "./job-analysis-layout";
import { JobAnalysisResponse } from "@/types/job-analysis";
import { Job } from "@/types/job";
import { analyzeJob } from "@/lib/job-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/job-api", () => ({
  analyzeJob: vi.fn(),
  createJob: vi.fn(),
}));

const analyzeJobMock = vi.mocked(analyzeJob);

const job: Job = {
  jobId: 55,
  userId: 9,
  inputType: "TEXT",
  jobTitle: "Frontend Engineer",
  companyName: "Acme",
  jobText: "Build accessible React interfaces.",
  jobLink: null,
  createdAt: "2026-05-12T10:00:00.000Z",
};

const analysisData: JobAnalysisResponse = {
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
  projectRecommendations: [
    {
      title: "Frontend Portfolio Project",
      description: "Build a tested app.",
      timeline: "1 week",
      difficultyLevel: "BEGINNER",
      skills: ["React"],
      milestones: [],
      cvPoints: ["Added a tested frontend project"],
      updatedInterviewPercentage: 90,
    },
  ],
};

describe("JobAnalysisLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders create mode with the form and no-analysis panel state", () => {
    render(<JobAnalysisLayout mode="CREATE" />);

    expect(screen.getByRole("heading", { name: "Job Analysis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Job Details" })).toBeInTheDocument();
    expect(screen.getByLabelText("Job Description")).toBeInTheDocument();
    expect(screen.getByText('No analysis yet. Click "Analyze" to get started.')).toBeInTheDocument();
  });

  it("renders analyze mode with job data and existing analysis", () => {
    render(<JobAnalysisLayout mode="ANALYZE" jobData={job} analysisData={analysisData} />);

    expect(screen.getByLabelText("Company Name")).toHaveValue("Acme");
    expect(screen.getByLabelText("Job Title")).toHaveValue("Frontend Engineer");
    expect(screen.getByLabelText("Job Description")).toHaveValue("Build accessible React interfaces.");
    expect(screen.getByRole("button", { name: "Analyze job description" })).toBeDisabled();
    expect(screen.getByText("81%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend Portfolio Project" })).toBeInTheDocument();
  });

  it("enables analyze mode for a saved job without existing analysis", async () => {
    const user = userEvent.setup();
    analyzeJobMock.mockResolvedValue(analysisData);

    render(<JobAnalysisLayout mode="ANALYZE" jobData={job} />);

    const analyzeButton = screen.getByRole("button", { name: "Analyze job description" });
    expect(analyzeButton).toBeEnabled();

    await user.click(analyzeButton);

    await waitFor(() => expect(analyzeJobMock).toHaveBeenCalledWith(55));
    expect(await screen.findByText("81%")).toBeInTheDocument();
  });

  it("keeps the analysis panel expanded when analysis fails", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    analyzeJobMock.mockRejectedValue(new Error("Analysis failed"));

    const { container } = render(<JobAnalysisLayout mode="ANALYZE" jobData={job} />);

    await user.click(screen.getByRole("button", { name: "Analyze job description" }));

    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(container.querySelector(".lg\\:grid-cols-3")).toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
