'use client';

import Link from 'next/link';
import AuthCard from '../ui/auth-card';
import Button from '../ui/button';

export default function Homepage() {
  return (
    <AuthCard
      title="AI Career Platform"
      subtitle="Unlock your potential with AI-powered career insights and analysis"
    >
      <div className="space-y-4">
        <Link href="/login" className="block">
          <Button variant="dark" className="w-full">
            Login
          </Button>
        </Link>
        <Link href="/signup" className="block">
          <Button variant="primary" className="w-full">
            Sign Up
          </Button>
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Get started with AI-powered job analysis and project recommendations.
        </p>
      </div>
    </AuthCard>
  );
}
