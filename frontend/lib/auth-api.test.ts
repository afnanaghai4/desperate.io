import { afterEach, describe, expect, it, vi } from "vitest";

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

async function loadAuthApiWithBaseUrl(baseUrl: string) {
  process.env.NEXT_PUBLIC_API_BASE_URL = baseUrl;
  vi.resetModules();
  return import("./auth-api");
}

describe("auth-api", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    vi.resetModules();
  });

  it("builds the Google OAuth start URL from the configured backend base URL", async () => {
    const { getGoogleLoginUrl } = await loadAuthApiWithBaseUrl("https://api.example.com");

    expect(getGoogleLoginUrl()).toBe("https://api.example.com/auth/google");
  });

  it("normalizes a trailing slash in the configured backend base URL", async () => {
    const { getGoogleLoginUrl } = await loadAuthApiWithBaseUrl("https://api.example.com/");

    expect(getGoogleLoginUrl()).toBe("https://api.example.com/auth/google");
  });

  it("falls back to the local backend URL", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    vi.resetModules();
    const { getGoogleLoginUrl } = await import("./auth-api");

    expect(getGoogleLoginUrl()).toBe("http://localhost:4000/auth/google");
  });
});
