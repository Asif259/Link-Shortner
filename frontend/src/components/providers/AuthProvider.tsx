'use client';

import React, { useEffect, useState } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Waits for Zustand to rehydrate from localStorage before rendering children.
 * This prevents protected pages from briefly flashing as unauthenticated.
 *
 * Must wrap the entire app (place in root layout).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist rehydrates synchronously on the first client render.
    // Deferring to the next tick is enough to ensure state is settled.
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // Render nothing (or a full-screen loader) while localStorage is loading.
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDEBE4]">
        <div className="w-8 h-8 rounded-full border-2 border-[#236B56] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
