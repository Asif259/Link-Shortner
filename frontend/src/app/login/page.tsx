'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Loader2, Zap, AlertCircle } from 'lucide-react';
import { useAuthStore, selectIsAuthenticated } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmailValid = validateEmail(email);
    const isPwValid = validatePassword(password);

    if (!isEmailValid || !isPwValid) {
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F5F3]">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#236B56] flex items-center justify-center shadow-lg shadow-[#236B56]/20">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A2621] tracking-tight">Welcome back</h1>
            <p className="text-xs text-[#61726A] mt-1">Sign in to manage and track your links</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200/70 p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-[#1A2621] block">
                Email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="name@example.com"
                  aria-invalid={emailError ? 'true' : undefined}
                  aria-describedby={emailError ? 'login-email-error' : undefined}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm text-[#1A2621] placeholder:text-stone-400 transition-all ${
                    emailError
                      ? 'bg-rose-50/20 border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500'
                      : 'bg-[#F4F5F3] border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#236B56] hover:border-stone-300'
                  }`}
                />
              </div>
              {emailError && (
                <p id="login-email-error" className="text-[11px] text-rose-600 font-medium pl-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-[#1A2621]">
                  Password <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="••••••••"
                  aria-invalid={passwordError ? 'true' : undefined}
                  aria-describedby={passwordError ? 'login-password-error' : undefined}
                  className={`w-full h-11 pl-4 pr-11 rounded-xl text-sm text-[#1A2621] placeholder:text-stone-400 transition-all ${
                    passwordError
                      ? 'bg-rose-50/20 border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500'
                      : 'bg-[#F4F5F3] border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#236B56] hover:border-stone-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#236B56]"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="login-password-error" className="text-[11px] text-rose-600 font-medium pl-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit CTA (Fitts's Law comfortable 44px height) */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full mt-2 font-semibold shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Register Navigation */}
        <p className="text-center text-xs text-[#61726A] mt-5">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[#236B56] font-bold hover:underline underline-offset-2"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
