'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../lib/use-api';

export default function StudioAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login, error: _authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#fff9eb] to-[#fff9eb]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--pulse-red)]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#fff9eb] to-[#fff9eb] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--neutral-200)] bg-white p-8 shadow-xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pulse-red)]/10 text-[var(--pulse-red)]">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--pulse-black)]">Admin Studio</h1>
        <p className="mt-2 text-sm text-[var(--neutral-600)]">
          This area is restricted to administrators. Enter your credentials to continue.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-3 text-[var(--pulse-black)] outline-none transition focus:border-[var(--pulse-red)]"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl border border-[var(--neutral-200)] px-4 py-3 pr-12 text-[var(--pulse-black)] outline-none transition focus:border-[var(--pulse-red)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--pulse-black)]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--pulse-black)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--pulse-red)] disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {isSubmitting ? 'Signing in...' : 'Enter Studio'}
          </button>
        </form>
      </div>
    </div>
  );
}
