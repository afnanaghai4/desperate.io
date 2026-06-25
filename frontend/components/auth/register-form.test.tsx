import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RegisterForm from "./register-form";
import { checkAuth, signupUser } from "@/lib/auth-api";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/auth-api", () => ({
  checkAuth: vi.fn(),
  signupUser: vi.fn(),
}));

const checkAuthMock = vi.mocked(checkAuth);
const signupUserMock = vi.mocked(signupUser);

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  async function renderReadyForm() {
    render(<RegisterForm />);
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
  }

  it("does not submit a whitespace-only username", async () => {
    const user = userEvent.setup();
    await renderReadyForm();

    await user.type(screen.getByLabelText("Username"), "   ");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByText("Username must be at least 3 characters long.")).toBeInTheDocument();
    expect(signupUserMock).not.toHaveBeenCalled();
  });

  it("submits a valid username after trimming surrounding spaces", async () => {
    const user = userEvent.setup();
    signupUserMock.mockResolvedValue({
      message: "User registered successfully",
      data: {
        user: {
          id: 1,
          email: "test@example.com",
        },
      },
    });
    await renderReadyForm();

    await user.type(screen.getByLabelText("Username"), "  tester  ");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(signupUserMock).toHaveBeenCalledWith({
        username: "tester",
        email: "test@example.com",
        password: "Password123!",
      });
    });
    expect(pushMock).toHaveBeenCalledWith("/profile/setup");
  });
});
