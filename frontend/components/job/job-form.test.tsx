import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JobForm from "./job-form";
import { analyzeJob, createJob } from "@/lib/job-api";
import { Job } from "@/types/job";
import { JobAnalysisResponse } from "@/types/job-analysis";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/job-api", () => ({
  analyzeJob: vi.fn(),
  createJob: vi.fn(),
}));

const createJobMock = vi.mocked(createJob);
const analyzeJobMock = vi.mocked(analyzeJob);

const validJobDescription =
  "Build accessible React interfaces for a software engineering role with TypeScript, testing, and product collaboration.";

const defaultProps = {
  onLoadingStart: vi.fn(),
  onAnalysisComplete: vi.fn(),
  onAnalysisError: vi.fn(),
  onClearAnalysis: vi.fn(),
};

const savedTextJob: Job = {
  jobId: 101,
  userId: 7,
  inputType: "TEXT",
  jobTitle: "Frontend Engineer",
  companyName: "Acme",
  jobText: validJobDescription,
  jobLink: null,
  createdAt: "2026-05-12T10:00:00.000Z",
};

const savedLinkJob: Job = {
  ...savedTextJob,
  jobId: 102,
  inputType: "LINK",
  jobText: null,
  jobLink: "https://example.com/jobs/frontend",
};

const analysis: JobAnalysisResponse = {
  matchPercentage: 82,
  extractedKeywords: {
    jobKeywords: ["React"],
    profileKeywords: ["React"],
    matchedKeywords: ["React"],
  },
  analysis: {
    strengths: ["Strong React experience"],
    weaknesses: ["Needs more testing depth"],
  },
  projectRecommendations: [],
};

function renderCreateForm() {
  return render(<JobForm {...defaultProps} mode="CREATE" />);
}

describe("JobForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the job creation form", () => {
    renderCreateForm();

    expect(screen.getByRole("heading", { name: "Job Details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paste Text" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Job Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Job Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit job analysis" })).toBeInTheDocument();
  });

  it("switches between TEXT and LINK input modes", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.type(screen.getByLabelText("Job Description"), "This text is cleared");
    await user.click(screen.getByRole("button", { name: "Job Link" }));

    expect(screen.queryByLabelText("Job Description")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Job Link")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Job Link" })).toHaveAttribute("aria-pressed", "true");

    await user.type(screen.getByLabelText("Job Link"), "https://example.com/jobs/frontend");
    await user.click(screen.getByRole("button", { name: "Paste Text" }));

    expect(screen.getByLabelText("Job Description")).toHaveValue("");
    expect(screen.queryByLabelText("Job Link")).not.toBeInTheDocument();
  });

  it("submits a TEXT job successfully and shows the current saved state", async () => {
    const user = userEvent.setup();
    createJobMock.mockResolvedValue({ message: "created", data: savedTextJob });
    renderCreateForm();

    await user.type(screen.getByLabelText("Company Name"), "Acme");
    await user.type(screen.getByLabelText("Job Title"), "Frontend Engineer");
    await user.type(screen.getByLabelText("Job Description"), validJobDescription);
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith({
        inputType: "TEXT",
        companyName: "Acme",
        jobTitle: "Frontend Engineer",
        jobText: validJobDescription,
        jobLink: undefined,
      });
    });
    expect(screen.getByRole("button", { name: "Analyze job description" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Job" })).toBeInTheDocument();
  });

  it("submits a LINK job successfully", async () => {
    const user = userEvent.setup();
    createJobMock.mockResolvedValue({ message: "created", data: savedLinkJob });
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Job Link" }));
    await user.type(screen.getByLabelText("Job Link"), "https://example.com/jobs/frontend");
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith({
        inputType: "LINK",
        companyName: undefined,
        jobTitle: undefined,
        jobText: undefined,
        jobLink: "https://example.com/jobs/frontend",
      });
    });
    expect(screen.getByRole("button", { name: "Analyze job description" })).toBeInTheDocument();
  });

  it("shows validation errors for invalid or missing input", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.type(screen.getByLabelText("Job Description"), "short");
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Job description must be at least 50 characters long.");
    expect(createJobMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Job Link" }));
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Job link is required.");
    expect(createJobMock).not.toHaveBeenCalled();
  });

  it("shows backend API errors from job creation", async () => {
    const user = userEvent.setup();
    createJobMock.mockRejectedValue(new Error("Unable to create job"));
    renderCreateForm();

    await user.type(screen.getByLabelText("Job Description"), validJobDescription);
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to create job");
  });

  it("disables submit while creation is loading", async () => {
    const user = userEvent.setup();
    let resolveCreateJob: (value: { message: string; data: Job }) => void = () => {};
    createJobMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCreateJob = resolve;
      }),
    );
    renderCreateForm();

    await user.type(screen.getByLabelText("Job Description"), validJobDescription);
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));

    expect(screen.getByRole("button", { name: "Submitting job analysis" })).toBeDisabled();

    resolveCreateJob({ message: "created", data: savedTextJob });
    expect(await screen.findByRole("button", { name: "Analyze job description" })).toBeInTheDocument();
  });

  it("runs analysis after a saved job and forwards the result", async () => {
    const user = userEvent.setup();
    createJobMock.mockResolvedValue({ message: "created", data: savedTextJob });
    analyzeJobMock.mockResolvedValue(analysis);
    renderCreateForm();

    await user.type(screen.getByLabelText("Job Description"), validJobDescription);
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));
    await user.click(await screen.findByRole("button", { name: "Analyze job description" }));

    expect(defaultProps.onLoadingStart).toHaveBeenCalled();
    await waitFor(() => expect(analyzeJobMock).toHaveBeenCalledWith(101));
    expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(analysis);
  });

  it("unlocks a saved job for editing when analysis validation fails", async () => {
    const user = userEvent.setup();
    createJobMock.mockResolvedValue({ message: "created", data: savedTextJob });
    analyzeJobMock.mockRejectedValue(
      new Error("Job description does not look like a job posting."),
    );
    renderCreateForm();

    await user.type(screen.getByLabelText("Job Description"), validJobDescription);
    await user.click(screen.getByRole("button", { name: "Submit job analysis" }));
    await user.click(await screen.findByRole("button", { name: "Analyze job description" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Job description does not look like a job posting.",
    );
    expect(screen.getByLabelText("Job Description")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Submit job analysis" })).toBeInTheDocument();
  });

  it("runs analysis in ANALYZE mode when the saved job has no analysis", async () => {
    const user = userEvent.setup();
    analyzeJobMock.mockResolvedValue(analysis);
    render(<JobForm {...defaultProps} mode="ANALYZE" jobData={savedTextJob} />);

    expect(screen.getByLabelText("Company Name")).toHaveValue("Acme");
    expect(screen.getByLabelText("Job Title")).toHaveValue("Frontend Engineer");
    expect(screen.getByLabelText("Job Description")).toHaveValue(validJobDescription);
    expect(screen.getByRole("button", { name: "Analyze job description" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Analyze job description" }));

    expect(defaultProps.onLoadingStart).toHaveBeenCalled();
    await waitFor(() => expect(analyzeJobMock).toHaveBeenCalledWith(101));
    expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(analysis);
  });

  it("keeps the go back label while analysis is loading", async () => {
    const user = userEvent.setup();
    let resolveAnalysis: (value: JobAnalysisResponse) => void = () => {};
    analyzeJobMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAnalysis = resolve;
      }),
    );
    render(<JobForm {...defaultProps} mode="ANALYZE" jobData={savedTextJob} />);

    await user.click(screen.getByRole("button", { name: "Analyze job description" }));

    expect(screen.getByRole("button", { name: "Analyzing job description" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go Back" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Analyzing..." })).not.toBeInTheDocument();

    resolveAnalysis(analysis);
    await waitFor(() => expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(analysis));
  });

  it("disables analysis in ANALYZE mode when analysis already exists", async () => {
    const user = userEvent.setup();
    render(<JobForm {...defaultProps} mode="ANALYZE" jobData={savedTextJob} hasAnalysis />);

    expect(screen.getByRole("button", { name: "Analyze job description" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Go Back" }));

    expect(pushMock).toHaveBeenCalledWith("/jobs");
    expect(analyzeJobMock).not.toHaveBeenCalled();
  });
});
