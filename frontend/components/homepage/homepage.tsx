'use client';

import { useRouter } from 'next/navigation';
import AuthCard from '../ui/auth-card';
import Button from '../ui/button';

export default function Homepage() {
  const router = useRouter();

  return (
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
  );
}
