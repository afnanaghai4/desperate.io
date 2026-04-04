'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/auth-api';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const userInfo = await checkAuth();
      
      if (userInfo) {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    verifyAuth();
  }, [router]);

  if (isLoading) {
    return null;
  }

  return <>{isAuthenticated && children}</>;
}
