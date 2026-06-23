"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { checkAuth } from "@/lib/auth-api";
import { getProfile } from "@/lib/users-api";

interface ProtectedShellProps {
  children: ReactNode;
  requireProfile?: boolean;
  showNavbar?: boolean;
}

type AccessState = "checking" | "allowed" | "redirecting" | "error";

export default function ProtectedShell({
  children,
  requireProfile = true,
  showNavbar = true,
}: ProtectedShellProps) {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [error, setError] = useState<string | null>(null);

  const verifyAccess = useCallback(async () => {
    const userInfo = await checkAuth();

    if (!userInfo) {
      setAccessState("redirecting");
      router.replace("/login");
      return;
    }

    if (!requireProfile) {
      setError(null);
      setAccessState("allowed");
      return;
    }

    try {
      const response = await getProfile();
      const hasProfile = response.data.profileDetails !== null;

      if (!hasProfile) {
        setAccessState("redirecting");
        router.replace("/profile/setup");
        return;
      }

      setError(null);
      setAccessState("allowed");
    } catch (err) {
      const isAuthError =
        err instanceof Error &&
        (err.message.includes("401") ||
          err.message.includes("403") ||
          err.message.includes("Unauthorized"));

      if (isAuthError) {
        setAccessState("redirecting");
        router.replace("/login");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify your profile. Please try again.",
      );
      setAccessState("error");
    }
  }, [requireProfile, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void verifyAccess();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [verifyAccess]);

  const handleRetry = () => {
    setAccessState("checking");
    setError(null);
    void verifyAccess();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {showNavbar ? <Navbar /> : null}
      {accessState === "allowed" ? children : null}
      {accessState === "checking" || accessState === "redirecting" ? (
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <span>Checking your session...</span>
          </div>
        </main>
      ) : null}
      {accessState === "error" ? (
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">
              Unable to Load Page
            </h1>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </main>
      ) : null}
      <Footer />
    </div>
  );
}
