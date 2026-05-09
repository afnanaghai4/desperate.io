'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/users-api';

interface ProfileGuardProps {
  children: React.ReactNode;
}

export default function ProfileGuard({ children }: ProfileGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
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
          // Transient/server error - stay in loading state and show error
          // This prevents redirecting when there's a temporary network issue
          setIsChecking(false);
          return;
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return hasProfile ? <>{children}</> : null;
}
