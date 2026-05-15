'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { auth } from '../../lib/api-client';

interface AdminAuthProps {
  onAuthenticated: () => void;
}

export default function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated via stored tokens
    auth.me()
      .then(() => {
        onAuthenticated();
      })
      .catch(() => {
        // Token invalid or expired
      });
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await auth.login(email, password);
      onAuthenticated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="main-content" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#fff9eb] to-white px-4">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--pulse-red)]/5 blur-[120px]" />
        <div className="absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-[var(--pulse-jasmine)]/30 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-[var(--pulse-red)]/8 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-[var(--neutral-200)] bg-white p-10 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)]">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--pulse-red)] to-[var(--pulse-red)]/80 shadow-lg">
              <Lock className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-center text-3xl font-bold text-[var(--pulse-black)]">
            Admin Panel
          </h1>
          <p className="mb-8 text-center text-base text-[var(--neutral-600)]">
            Enter your credentials to access the dashboard
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[var(--pulse-black)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--neutral-300)] bg-white px-4 py-3 text-[var(--pulse-black)] transition-all focus:border-[var(--pulse-red)] focus:outline-none focus:ring-2 focus:ring-[var(--pulse-red)]/20"
                placeholder="admin@pulse.dev"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[var(--pulse-black)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--neutral-300)] bg-white px-4 py-3 pr-12 text-[var(--pulse-black)] transition-all focus:border-[var(--pulse-red)] focus:outline-none focus:ring-2 focus:ring-[var(--pulse-red)]/20"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--neutral-500)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm font-semibold text-[var(--pulse-red)]">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl bg-[var(--pulse-black)] px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? 'Verifying...' : 'Sign In'}
                {!isLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--pulse-red)] to-[var(--pulse-red)]/80 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
