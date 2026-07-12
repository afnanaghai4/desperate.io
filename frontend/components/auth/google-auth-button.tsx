'use client';

import { startGoogleLogin } from '@/lib/auth-api';

type GoogleAuthButtonProps = {
  disabled?: boolean;
};

export default function GoogleAuthButton({ disabled }: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={startGoogleLogin}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span aria-hidden="true" className="text-base font-bold">
        G
      </span>
      Continue with Google
    </button>
  );
}
