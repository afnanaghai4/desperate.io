'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { signupUser } from '@/lib/auth-api';
import AuthCard from '../ui/auth-card';
import InputField from '../ui/input-field';
import AuthButton from '../ui/auth-button';

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
       await signupUser({ username, email, password });
      router.push('/login');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Signup failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome!"
      subtitle="Sign up to get started."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <InputField
          id="username"
          label="Username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
        />
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
        <AuthButton text={isLoading ? 'Signing Up...' : 'Sign Up'} disabled={isLoading} />
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-black underline">
          Log In
        </Link>
      </p>
    </AuthCard>
  );
}
