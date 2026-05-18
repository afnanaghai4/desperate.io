'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkAuth } from '@/lib/auth-api';
import AuthCard from '../ui/auth-card';
import Button from '../ui/button';

export default function Homepage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const user = await checkAuth();
      if (user) {
        // User is logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not logged in, show homepage
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  return (
    <>
      {isLoading ? (
        <AuthCard
          title="AI Career Platform"
          subtitle="Loading..."
        >
          <div className="text-center text-gray-600">
            Checking your session...
          </div>
        </AuthCard>
      ) : (
        <AuthCard
          title="AI Career Platform"
          subtitle="Unlock your potential with AI-powered career insights and analysis"
        >
          <div className="space-y-4">
            <Button
              variant="dark"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Get started with AI-powered job analysis and project recommendations.
            </p>
          </div>
        </AuthCard>
      )}
    </>
  );
}
