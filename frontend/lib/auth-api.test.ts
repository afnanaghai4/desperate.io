import { describe, expect, it } from "vitest";

import { getGoogleLoginUrl } from "./auth-api";

describe("auth-api", () => {
  it("builds the Google OAuth start URL from the backend base URL", () => {
    expect(getGoogleLoginUrl()).toBe("http://localhost:4000/auth/google");
  });
});
