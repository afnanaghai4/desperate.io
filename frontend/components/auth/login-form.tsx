import Link from "next/link";

import AuthCard from "../ui/auth-card";
import InputField from "../ui/input-field";
import AuthButton from "../ui/auth-button";

export default function LoginForm() {
  return (
    <AuthCard
      title="Welcome Back!"
      subtitle="Sign in to continue to your dashboard."
    >
      <form className="space-y-5">
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your Password"
        />
        <AuthButton text="Sign In" />
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
