import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import JobsList from "./jobs-list";
import { Job } from "@/types/job";

const jobs: Job[] = [
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
    jobTitle: null,
    companyName: null,
    jobText: null,
    jobLink: "https://example.com/jobs/backend",
    createdAt: "2026-05-11T10:00:00.000Z",
  },
];

const baseProps = {
  jobs,
  currentPage: 1,
  totalPages: 2,
  onPreviousPage: vi.fn(),
  onNextPage: vi.fn(),
  isLoading: false,
  onView: vi.fn(),
  onDelete: vi.fn(),
};

describe("JobsList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the loading state", () => {
    render(<JobsList {...baseProps} jobs={[]} isLoading />);

    expect(screen.getByText("Loading jobs...")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<JobsList {...baseProps} jobs={[]} />);

    expect(screen.getByText("No jobs created yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first job to get started")).toBeInTheDocument();
  });

  it("renders jobs returned by the API with their visible details", () => {
    render(<JobsList {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("TEXT")).toBeInTheDocument();
    expect(screen.getByText("Build accessible React interfaces.")).toBeInTheDocument();
    expect(screen.getAllByText(/Created:/)).toHaveLength(2);

    expect(screen.getByRole("heading", { name: "Untitled Job" })).toBeInTheDocument();
    expect(screen.getByText("No company")).toBeInTheDocument();
    expect(screen.getByText("LINK")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/jobs/backend")).toBeInTheDocument();
  });

  it("handles pagination controls", async () => {
    const user = userEvent.setup();
    const onPreviousPage = vi.fn();
    const onNextPage = vi.fn();

    render(
      <JobsList
        {...baseProps}
        currentPage={2}
        totalPages={3}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onPreviousPage).toHaveBeenCalledTimes(1);
    expect(onNextPage).toHaveBeenCalledTimes(1);
  });

  it("disables unavailable pagination actions", () => {
    const { rerender } = render(<JobsList {...baseProps} currentPage={1} totalPages={3} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    rerender(<JobsList {...baseProps} currentPage={3} totalPages={3} />);

    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("opens and deletes the selected job", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onDelete = vi.fn();
    render(<JobsList {...baseProps} onView={onView} onDelete={onDelete} />);

    const frontendHeading = screen.getByRole("heading", { name: "Frontend Engineer" });
    const frontendCard = frontendHeading.parentElement?.parentElement;
    expect(frontendCard).not.toBeNull();

    await user.click(within(frontendCard as HTMLElement).getByRole("button", { name: "View" }));
    await user.click(within(frontendCard as HTMLElement).getByRole("button", { name: "Delete" }));

    expect(onView).toHaveBeenCalledWith(1);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
