'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, ChartNoAxesColumnIncreasing, Hammer, UserRound } from 'lucide-react';
import { checkAuth } from '@/lib/auth-api';
import AuthCard from '../ui/auth-card';
import Button from '../ui/button';

const workflowSteps = [
  {
    title: 'Profile',
    description: 'Add your work history and skills.',
    icon: UserRound,
  },
  {
    title: 'Target',
    description: 'Save the job posting you want to pursue.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Analyze',
    description: 'Compare the role against your profile.',
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    title: 'Build',
    description: 'Use project recommendations to close the gaps.',
    icon: Hammer,
  },
];

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

          <section className="mt-6 border-t border-gray-200 pt-6 text-left">
            <h2 className="text-sm font-semibold text-gray-900">
              How it works
            </h2>
            <ol className="mt-4 space-y-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li key={step.title} className="relative flex gap-3">
                    {index < workflowSteps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-5 top-10 h-[calc(100%-1rem)] w-px bg-gray-200"
                      />
                    )}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-700">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase text-blue-700">
                          Step {index + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </AuthCard>
      )}
    </>
  );
}
