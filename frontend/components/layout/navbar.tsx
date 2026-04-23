"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, CircleUserRound, LogOut, Settings, User } from "lucide-react";
import { logoutUser } from '@/lib/auth-api';

export default function Navbar() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

        // Secure logout flow:
        // 1. Call logoutUser() which makes a POST request to /auth/logout
        // 2. The backend responds with Set-Cookie: ; Max-Age=0 to clear the HTTP-only cookie
        // 3. The browser automatically deletes the cookie (credentials: 'include' handles this)
        // 4. Redirect to login page
        const handleLogout = async () => {
            await logoutUser();
            // The HTTP-only cookie has been cleared by the backend
            // Redirect to login page
            router.push('/login');
        };

        return(
            <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="text-2xl font-bold tracking-tight text-gray-900"
        >
          Des
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <CircleUserRound className="h-6 w-6" />
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-50">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">My Account</p>
                <p className="text-xs text-gray-500">Manage your profile</p>
              </div>

              <div className="py-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

