import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedShell from "./protected-shell";
import { checkAuth } from "@/lib/auth-api";
import { getProfile } from "@/lib/users-api";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
}));

vi.mock("@/components/layout/navbar", () => ({
  default: () => <header>Navbar</header>,
}));

vi.mock("@/components/layout/footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("@/lib/auth-api", () => ({
  checkAuth: vi.fn(),
}));

vi.mock("@/lib/users-api", () => ({
  getProfile: vi.fn(),
}));

const checkAuthMock = vi.mocked(checkAuth);
const getProfileMock = vi.mocked(getProfile);

const completeProfileResponse = {
  message: "Profile retrieved successfully",
  data: {
    email: "afnan@example.com",
    username: "afnan",
    profileDetails: {
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
        },
      ],
      experiences: [],
    },
  },
};

describe("ProtectedShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue({
      id: 1,
      email: "afnan@example.com",
      username: "afnan",
    });
    getProfileMock.mockResolvedValue(completeProfileResponse);
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects unauthenticated users to login", async () => {
    checkAuthMock.mockResolvedValue(null);

    render(
      <ProtectedShell>
        <main>Protected content</main>
      </ProtectedShell>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it("redirects authenticated users with incomplete profiles to setup", async () => {
    getProfileMock.mockResolvedValue({
      ...completeProfileResponse,
      data: {
        ...completeProfileResponse.data,
        profileDetails: {
          ...completeProfileResponse.data.profileDetails,
          educations: [],
        },
      },
    });

    render(
      <ProtectedShell>
        <main>Protected content</main>
      </ProtectedShell>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/profile/setup");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users with complete profiles", async () => {
    render(
      <ProtectedShell>
        <main>Protected content</main>
      </ProtectedShell>,
    );

    expect(await screen.findByText("Protected content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("skips profile completeness when requireProfile is false", async () => {
    render(
      <ProtectedShell requireProfile={false}>
        <main>Setup content</main>
      </ProtectedShell>,
    );

    expect(await screen.findByText("Setup content")).toBeInTheDocument();
    expect(getProfileMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
