import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JobsPageContent from "./jobs-page-content";
import { deleteJob, getJobs } from "@/lib/job-api";
import { Job } from "@/types/job";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/job-api", () => ({
  deleteJob: vi.fn(),
  getJobs: vi.fn(),
}));

const getJobsMock = vi.mocked(getJobs);
const deleteJobMock = vi.mocked(deleteJob);
let logSpy: ReturnType<typeof vi.spyOn>;

const firstPageJobs: Job[] = [
  {
    jobId: 1,
    userId: 10,
    inputType: "TEXT",
    jobTitle: "Frontend Engineer",
    companyName: "Acme",
    jobText: "Build accessible React interfaces.",
    jobLink: null,
    createdAt: "2026-05-12T10:00:00.000Z",
  },
  {
    jobId: 2,
    userId: 10,
    inputType: "LINK",
    jobTitle: "Backend Engineer",
    companyName: "Beta",
    jobText: null,
    jobLink: "https://example.com/jobs/backend",
    createdAt: "2026-05-11T10:00:00.000Z",
  },
];

const secondPageJobs: Job[] = [
  {
    jobId: 3,
    userId: 10,
    inputType: "TEXT",
    jobTitle: "Cloud Engineer",
    companyName: "Gamma",
    jobText: "Operate cloud infrastructure.",
    jobLink: null,
    createdAt: "2026-05-10T10:00:00.000Z",
  },
];

describe("JobsPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    cleanup();
  });

  it("renders jobs returned by the API", async () => {
    getJobsMock.mockResolvedValue({
      jobs: firstPageJobs,
      hasMore: true,
      totalCount: 3,
      totalPages: 2,
    });

    render(<JobsPageContent />);

    expect(screen.getByText("Loading jobs...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(getJobsMock).toHaveBeenCalledWith(0, 6);
  });

  it("renders the empty state when no jobs exist", async () => {
    getJobsMock.mockResolvedValue({
      jobs: [],
      hasMore: false,
      totalCount: 0,
      totalPages: 1,
    });

    render(<JobsPageContent />);

    expect(await screen.findByText("No jobs created yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first job to get started")).toBeInTheDocument();
  });

  it("handles current API error behavior by logging and showing the empty state", async () => {
    getJobsMock.mockRejectedValue(new Error("Failed to fetch jobs"));

    render(<JobsPageContent />);

    expect(await screen.findByText("No jobs created yet")).toBeInTheDocument();
    expect(logSpy).toHaveBeenCalledWith("Failed to fetch jobs");

  });

  it("opens the selected job detail page", async () => {
    const user = userEvent.setup();
    getJobsMock.mockResolvedValue({
      jobs: firstPageJobs,
      hasMore: true,
      totalCount: 3,
      totalPages: 2,
    });

    render(<JobsPageContent />);

    const frontendHeading = await screen.findByRole("heading", { name: "Frontend Engineer" });
    const frontendCard = frontendHeading.parentElement?.parentElement;
    expect(frontendCard).not.toBeNull();

    await user.click(within(frontendCard as HTMLElement).getByRole("button", { name: "View" }));

    expect(pushMock).toHaveBeenCalledWith("/jobs/1");
  });

  it("loads the next page when pagination is used", async () => {
    const user = userEvent.setup();
    getJobsMock
      .mockResolvedValueOnce({
        jobs: firstPageJobs,
        hasMore: true,
        totalCount: 3,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        jobs: secondPageJobs,
        hasMore: false,
        totalCount: 3,
        totalPages: 2,
      });

    render(<JobsPageContent />);

    expect(await screen.findByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("heading", { name: "Cloud Engineer" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Frontend Engineer" })).not.toBeInTheDocument();
    expect(getJobsMock).toHaveBeenLastCalledWith(6, 6);
  });

  it("deletes a job and removes it from the current list", async () => {
    const user = userEvent.setup();
    getJobsMock.mockResolvedValue({
      jobs: firstPageJobs,
      hasMore: true,
      totalCount: 3,
      totalPages: 2,
    });
    deleteJobMock.mockResolvedValue(undefined);

    render(<JobsPageContent />);

    const frontendHeading = await screen.findByRole("heading", { name: "Frontend Engineer" });
    const frontendCard = frontendHeading.parentElement?.parentElement;
    expect(frontendCard).not.toBeNull();

    await user.click(within(frontendCard as HTMLElement).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteJobMock).toHaveBeenCalledWith(1));
    expect(screen.queryByRole("heading", { name: "Frontend Engineer" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
  });

  it("keeps the current list and logs when delete fails", async () => {
    const user = userEvent.setup();
    getJobsMock.mockResolvedValue({
      jobs: firstPageJobs,
      hasMore: true,
      totalCount: 3,
      totalPages: 2,
    });
    deleteJobMock.mockRejectedValue(new Error("Failed to delete job"));

    render(<JobsPageContent />);

    const frontendHeading = await screen.findByRole("heading", { name: "Frontend Engineer" });
    const frontendCard = frontendHeading.parentElement?.parentElement;
    expect(frontendCard).not.toBeNull();

    await user.click(within(frontendCard as HTMLElement).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteJobMock).toHaveBeenCalledWith(1));
    expect(await screen.findByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument();
    expect(logSpy).toHaveBeenCalledWith("Failed to delete job");

  });
});
