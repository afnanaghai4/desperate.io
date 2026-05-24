import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardWidgets from "./dashboard-widgets";
import { getJobs } from "@/lib/job-api";
import { getProfile } from "@/lib/users-api";
import { type Job } from "@/types/job";

vi.mock("@/lib/job-api", () => ({
  getJobs: vi.fn(),
}));

vi.mock("@/lib/users-api", () => ({
  getProfile: vi.fn(),
}));

const getJobsMock = vi.mocked(getJobs);
const getProfileMock = vi.mocked(getProfile);

const recentJobs: Job[] = [
  {
    jobId: 12,
    userId: 3,
    inputType: "TEXT",
    jobTitle: "Frontend Engineer",
    companyName: "Acme",
    jobText: "Build accessible interfaces.",
    jobLink: null,
    createdAt: "2026-05-20T12:00:00.000Z",
    hasAnalysis: true,
  },
  {
    jobId: 13,
    userId: 3,
    inputType: "LINK",
    jobTitle: "Cloud Engineer",
    companyName: "Beta",
    jobText: null,
    jobLink: "https://example.com/jobs/cloud",
    createdAt: "2026-05-19T12:00:00.000Z",
    hasAnalysis: false,
  },
];

function mockProfileResponse() {
  getProfileMock.mockResolvedValue({
    message: "Profile loaded",
    data: {
      email: "user@example.com",
      username: "user",
      profileDetails: {
        personalInfo: {
          fullName: "Afnan Aghai",
          phone: "+491234",
        },
        experiences: [
          {
            currentPosition: "Frontend Engineer",
            company: "Acme",
            skills: "React, TypeScript",
          },
        ],
      },
    },
  });
}

describe("DashboardWidgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileResponse();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the dashboard actions and loaded recent jobs", async () => {
    getJobsMock.mockResolvedValue({
      jobs: recentJobs,
      hasMore: false,
      totalCount: 2,
      totalPages: 1,
    });

    render(<DashboardWidgets />);

    expect(screen.getByText("Loading recent jobs...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cloud Engineer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Analyze a Job/i })).toHaveAttribute(
      "href",
      "/jobs/create"
    );
    expect(screen.getByRole("link", { name: /Update Profile/i })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.getByRole("progressbar", { name: "Profile 86% complete" })).toBeInTheDocument();
    expect(screen.getByText("Saved jobs")).toBeInTheDocument();
    expect(screen.getByText("Recent analyses")).toBeInTheDocument();
    expect(getJobsMock).toHaveBeenCalledWith(0, 3);
    expect(getProfileMock).toHaveBeenCalled();
  });

  it("renders an empty recent jobs state", async () => {
    getJobsMock.mockResolvedValue({
      jobs: [],
      hasMore: false,
      totalCount: 0,
      totalPages: 1,
    });

    render(<DashboardWidgets />);

    expect(await screen.findByText("No jobs saved yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Job" })).toHaveAttribute(
      "href",
      "/jobs/create"
    );
  });

  it("renders an error state when dashboard data cannot load", async () => {
    getJobsMock.mockRejectedValue(new Error("Failed to fetch jobs"));

    render(<DashboardWidgets />);

    expect(await screen.findByText(/Unable to load recent jobs/i)).toBeInTheDocument();
    expect(screen.getByText("Profile progress is unavailable right now.")).toBeInTheDocument();
  });
});
