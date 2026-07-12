import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginForm from "./login-form";
import { checkAuth, loginUser, startGoogleLogin } from "@/lib/auth-api";
import { getProfile } from "@/lib/users-api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/auth-api", () => ({
  checkAuth: vi.fn(),
  loginUser: vi.fn(),
  startGoogleLogin: vi.fn(),
}));

vi.mock("@/lib/users-api", () => ({
  getProfile: vi.fn(),
}));

const checkAuthMock = vi.mocked(checkAuth);
const loginUserMock = vi.mocked(loginUser);
const startGoogleLoginMock = vi.mocked(startGoogleLogin);
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

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/login");
    checkAuthMock.mockResolvedValue(null);
    loginUserMock.mockResolvedValue({
      message: "Login successful",
      data: {
        accessToken: "test-token",
        user: {
          id: 1,
          email: "afnan@example.com",
        },
      },
    });
    getProfileMock.mockResolvedValue(completeProfileResponse);
  });

  afterEach(() => {
    cleanup();
  });

  async function submitLoginForm() {
    const user = userEvent.setup();
    render(<LoginForm />);

    await screen.findByLabelText("Email");
    await user.type(screen.getByLabelText("Email"), "afnan@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));
  }

  it("routes to dashboard after login when profile is complete", async () => {
    await submitLoginForm();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("starts Google login from the Google button", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await screen.findByRole("button", { name: "Continue with Google" });
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(startGoogleLoginMock).toHaveBeenCalledTimes(1);
    expect(loginUserMock).not.toHaveBeenCalled();
  });

  it("shows a Google failure message from the callback query", async () => {
    window.history.pushState({}, "", "/login?authError=google_failed");

    render(<LoginForm />);

    expect(await screen.findByText("Google sign-in failed. Please try again.")).toBeInTheDocument();
  });

  it("shows a Google email conflict message from the callback query", async () => {
    window.history.pushState({}, "", "/login?authError=google_email_conflict");

    render(<LoginForm />);

    expect(
      await screen.findByText(
        "An account already exists for that email. Sign in with your email and password to continue.",
      ),
    ).toBeInTheDocument();
  });

  it("routes to profile setup after login when academic details are missing", async () => {
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

    await submitLoginForm();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/profile/setup");
    });
  });
});
