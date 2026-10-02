'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated } from '@/lib/stores/auth.store';

/**
 * Protected layout for all /dashboard/* routes.
 * Redirects to /login if the user is not authenticated.
 * AuthProvider (in root layout) has already resolved hydration,
 * so the check here is synchronous — no flash.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    // Render nothing while the redirect is in-flight.
    return null;
  }

  return <>{children}</>;
}
