'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/users-api';

interface ProfileGuardProps {
  children: React.ReactNode;
}

export default function ProfileGuard({ children }: ProfileGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkProfile = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const response = await getProfile();
      const profileExists = response.data.profileDetails !== null;
      
      if (!profileExists) {
        // Profile not complete, redirect to setup
        router.push('/profile/setup');
      } else {
        setHasProfile(true);
      }
    } catch (err) {
      // Distinguish auth errors (401/403) from transient errors
      const isAuthError = err instanceof Error && 
        (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized'));
      
      if (isAuthError) {
        // Auth error - user is not authenticated, redirect to setup
        router.push('/profile/setup');
      } else {
        // Transient/server error - show error state with retry option
        const errorMsg = err instanceof Error ? err.message : 'Failed to load profile. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkProfile();
  }, [checkProfile]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Unable to Load Profile</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => checkProfile()}
            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return hasProfile ? <>{children}</> : null;
}
