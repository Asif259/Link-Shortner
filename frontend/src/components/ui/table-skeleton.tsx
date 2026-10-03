'use client';

import React from 'react';

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="divide-y divide-stone-100 animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between py-4 px-4 gap-4 bg-white"
        >
          {/* Short Code Slug & Copy */}
          <div className="flex items-center gap-2 w-1/4">
            <div className="h-4 w-28 bg-stone-200/80 rounded-md" />
            <div className="h-6 w-6 bg-stone-200/60 rounded-md" />
          </div>

          {/* Destination URL */}
          <div className="h-3.5 w-1/3 bg-stone-200/60 rounded-md" />

          {/* Clicks */}
          <div className="h-4 w-10 bg-stone-200/70 rounded-md" />

          {/* Date */}
          <div className="h-3.5 w-16 bg-stone-200/50 rounded-md" />

          {/* Status pill */}
          <div className="h-5 w-14 bg-stone-200/70 rounded-full" />

          {/* Actions */}
          <div className="h-7 w-8 bg-stone-200/60 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
