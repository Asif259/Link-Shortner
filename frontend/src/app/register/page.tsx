'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, User, Mail, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore, selectIsAuthenticated } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  // Goal-Gradient: Compute password strength (0 to 3)
  const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
    if (!pw) return { score: 0, label: '', color: 'bg-stone-200' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Good', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-600' };
  };

  const strength = getPasswordStrength(password);

  const validateName = (val: string): boolean => {
    if (!val.trim()) {
      setNameError('Full name is required');
      return false;
    }
    setNameError(null);
    return true;
  };

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
    if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isNameOk = validateName(name);
    const isEmailOk = validateEmail(email);
    const isPwOk = validatePassword(password);

    if (!isNameOk || !isEmailOk || !isPwOk) {
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      // Automatically log in after registration for a smooth experience
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
            <h1 className="text-2xl font-bold text-[#1A2621] tracking-tight">Create your account</h1>
            <p className="text-xs text-[#61726A] mt-1">Start shortening and tracking links for free</p>
          </div>
        </div>

        {/* Card */}
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

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="text-xs font-semibold text-[#1A2621] block">
                Full name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) validateName(e.target.value);
                  }}
                  onBlur={() => validateName(name)}
                  placeholder="Alex Smith"
                  aria-invalid={nameError ? 'true' : undefined}
                  aria-describedby={nameError ? 'register-name-error' : undefined}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm text-[#1A2621] placeholder:text-stone-400 transition-all ${
                    nameError
                      ? 'bg-rose-50/20 border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500'
                      : 'bg-[#F4F5F3] border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#236B56] hover:border-stone-300'
                  }`}
                />
              </div>
              {nameError && (
                <p id="register-name-error" className="text-[11px] text-rose-600 font-medium pl-1">
                  {nameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-xs font-semibold text-[#1A2621] block">
                Email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="alex@example.com"
                  aria-invalid={emailError ? 'true' : undefined}
                  aria-describedby={emailError ? 'register-email-error' : undefined}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm text-[#1A2621] placeholder:text-stone-400 transition-all ${
                    emailError
                      ? 'bg-rose-50/20 border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500'
                      : 'bg-[#F4F5F3] border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#236B56] hover:border-stone-300'
                  }`}
                />
              </div>
              {emailError && (
                <p id="register-email-error" className="text-[11px] text-rose-600 font-medium pl-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="register-password" className="text-xs font-semibold text-[#1A2621]">
                  Password <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">Min 6 characters</span>
              </div>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="••••••••"
                  aria-invalid={passwordError ? 'true' : undefined}
                  aria-describedby={passwordError ? 'register-password-error' : undefined}
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
                <p id="register-password-error" className="text-[11px] text-rose-600 font-medium pl-1">
                  {passwordError}
                </p>
              )}

              {/* Goal-Gradient Password Strength Indicator */}
              {password && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">Strength:</span>
                    <span
                      className={`font-semibold ${
                        strength.score === 1
                          ? 'text-rose-600'
                          : strength.score === 2
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div
                      className={`rounded-full transition-colors ${
                        strength.score >= 1 ? strength.color : 'bg-stone-200'
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors ${
                        strength.score >= 2 ? strength.color : 'bg-stone-200'
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors ${
                        strength.score >= 3 ? strength.color : 'bg-stone-200'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit CTA */}
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
                  <span>Creating account…</span>
                </>
              ) : (
                'Create free account'
              )}
            </Button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-xs text-[#61726A] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#236B56] font-bold hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
