import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileContainer from "./profile-container";
import { getProfile, updateProfile } from "@/lib/users-api";

vi.mock("@/lib/users-api", () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

const getProfileMock = vi.mocked(getProfile);
const updateProfileMock = vi.mocked(updateProfile);

describe("ProfileContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
    getProfileMock.mockResolvedValue({
      message: "Profile retrieved successfully",
      data: {
        email: "afnan@example.com",
        username: "afnan",
        profileDetails: {
          personalInfo: {
            fullName: "Afnan Aghai",
            phone: "+491234",
            address: "Berlin",
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
              description: "Distributed systems",
            },
          ],
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
    updateProfileMock.mockResolvedValue({
      message: "Profile updated successfully",
      data: {
        email: "afnan@example.com",
        username: "afnan",
        profileDetails: {},
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("loads academic details and includes them when updating the profile", async () => {
    const user = userEvent.setup();
    render(<ProfileContainer />);

    await screen.findByRole("button", { name: "Academic Details" });
    await user.click(screen.getByRole("button", { name: "Academic Details" }));

    expect(screen.getByDisplayValue("TU Berlin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("MSc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Computer Science")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Professional Details" }));
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          educations: [
            {
              instituteName: "TU Berlin",
              degreeName: "MSc",
              fieldOfStudy: "Computer Science",
              startDate: "2021-10-01",
              endDate: "2023-09-30",
              currentlyAttending: false,
              gradeCgpa: "1.7",
              description: "Distributed systems",
            },
          ],
        })
      );
    });
  });
});
