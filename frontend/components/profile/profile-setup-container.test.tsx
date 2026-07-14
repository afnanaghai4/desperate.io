import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileSetupContainer from "./profile-setup-container";
import { checkAuth } from "@/lib/auth-api";
import { createProfile } from "@/lib/users-api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/auth-api", () => ({
  checkAuth: vi.fn(),
}));

vi.mock("@/lib/users-api", () => ({
  createProfile: vi.fn(),
}));

const checkAuthMock = vi.mocked(checkAuth);
const createProfileMock = vi.mocked(createProfile);

describe("ProfileSetupContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue({
      id: 1,
      username: "afnan",
      email: "afnan@example.com",
    });
    createProfileMock.mockResolvedValue({
      userId: 1,
      username: "afnan",
      email: "afnan@example.com",
      role: "USER",
      profileDetails: null,
      createdAt: "2026-06-30T00:00:00.000Z",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("requires at least one valid education before creating a profile", async () => {
    const user = userEvent.setup();
    render(<ProfileSetupContainer />);

    await screen.findByPlaceholderText("Enter your full name");
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your username")).toHaveValue("afnan");
    expect(screen.getByPlaceholderText("Your username")).toHaveAttribute("readonly");
    await user.type(screen.getByPlaceholderText("Enter your full name"), "Afnan Aghai");
    await user.click(screen.getByRole("button", { name: "Professional Details" }));
    await user.click(screen.getByRole("button", { name: "Complete" }));

    expect(await screen.findByText("At least one education is required to continue.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Academic Details" })).toBeInTheDocument();
    expect(createProfileMock).not.toHaveBeenCalled();
  });

  it("marks required academic fields and keeps professional details optional", async () => {
    const user = userEvent.setup();
    render(<ProfileSetupContainer />);

    await screen.findByPlaceholderText("Enter your full name");
    await user.click(screen.getAllByRole("button", { name: "Continue" })[0]);

    expect(screen.getByText("Institute Name").parentElement).toHaveTextContent("*");
    expect(screen.getByText("Degree Name").parentElement).toHaveTextContent("*");
    expect(screen.getByText("Field of Study").parentElement).toHaveTextContent("*");
    expect(screen.getByText("Start Date").parentElement).toHaveTextContent("*");
    expect(screen.getByText("End Date").parentElement).toHaveTextContent("*");

    await user.click(screen.getByRole("checkbox", { name: "Currently Attending" }));

    expect(screen.getByText("End Date").parentElement).not.toHaveTextContent("*");
  });

  it("saves optional professional experience summaries without requiring them", async () => {
    const user = userEvent.setup();
    render(<ProfileSetupContainer />);

    await screen.findByPlaceholderText("Enter your full name");
    await user.type(screen.getByPlaceholderText("Enter your full name"), "Afnan Aghai");
    await user.click(screen.getAllByRole("button", { name: "Continue" })[0]);

    await user.type(screen.getByLabelText(/Institute Name/), "TU Berlin");
    await user.type(screen.getByLabelText(/Degree Name/), "MSc");
    await user.type(screen.getByLabelText(/Field of Study/), "Computer Science");
    await user.type(screen.getByLabelText(/Start Date/), "2021-10-01");
    await user.type(screen.getByLabelText(/End Date/), "2023-09-30");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Add Experience" }));

    await user.type(screen.getByLabelText("Current Position"), "Intern");
    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.type(
      screen.getByLabelText("Experience Summary"),
      "Built internal dashboards with React.",
    );
    await user.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(createProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          experiences: [
            expect.objectContaining({
              currentPosition: "Intern",
              company: "Acme",
              experience: "Built internal dashboards with React.",
            }),
          ],
        }),
      );
    });
  });

  it("creates a profile with educations in the payload", async () => {
    const user = userEvent.setup();
    render(<ProfileSetupContainer />);

    await screen.findByPlaceholderText("Enter your full name");
    await user.type(screen.getByPlaceholderText("Enter your full name"), "Afnan Aghai");
    await user.click(screen.getAllByRole("button", { name: "Continue" })[0]);

    await user.type(screen.getByLabelText(/Institute Name/), "TU Berlin");
    await user.type(screen.getByLabelText(/Degree Name/), "MSc");
    await user.type(screen.getByLabelText(/Field of Study/), "Computer Science");
    await user.type(screen.getByLabelText(/Start Date/), "2021-10-01");
    await user.type(screen.getByLabelText(/End Date/), "2023-09-30");
    await user.type(screen.getByPlaceholderText("Enter your grade or CGPA"), "1.7");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(createProfileMock).toHaveBeenCalledWith({
        personalInfo: {
          fullName: "Afnan Aghai",
        },
        educations: [
          {
            instituteName: "TU Berlin",
            degreeName: "MSc",
            fieldOfStudy: "Computer Science",
            startDate: "2021-10-01",
            endDate: "2023-09-30",
            currentlyAttending: false,
            gradeCgpa: "1.7",
            description: "",
          },
        ],
        experiences: [],
      });
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
