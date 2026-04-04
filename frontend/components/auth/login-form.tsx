'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { loginUser, checkAuth } from '@/lib/auth-api';
import AuthCard from '../ui/auth-card';
import InputField from '../ui/input-field';
import AuthButton from '../ui/auth-button';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      const userInfo = await checkAuth();
      if (userInfo) {
        // User is already authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, show login form
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <AuthCard
        title="Welcome Back!"
        subtitle="Sign in to continue to your dashboard."
      >
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
        </div>
      </AuthCard>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // loginUser() calls the backend API
      // The backend responds with Set-Cookie header
      // The browser (via credentials: 'include') automatically stores it as an HTTP-only cookie
      // No token is stored in JavaScript or localStorage - it's safe from XSS
      await loginUser({ email, password });
      // Redirect to dashboard on success
      // The HTTP-only cookie will be sent automatically with future requests
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome Back!"
      subtitle="Sign in to continue to your dashboard."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <AuthButton text={isLoading ? 'Signing In...' : 'Sign In'} disabled={isLoading} />
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-black underline">
          Sign Up
        </Link>
      </p>
    </AuthCard>
  );
}
