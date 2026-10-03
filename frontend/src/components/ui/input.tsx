'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'flex h-10 w-full rounded-full border bg-white px-4 py-2 text-sm text-[#1A2621] placeholder:text-stone-400 focus-visible:outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-rose-400 focus-visible:ring-2 focus-visible:ring-rose-500 bg-rose-50/20'
            : 'border-stone-200/80 focus-visible:ring-2 focus-visible:ring-[#236B56] hover:border-stone-300',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

