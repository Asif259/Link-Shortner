'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#236B56] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 cursor-pointer',
          // Variants
          variant === 'primary' && 'bg-[#236B56] text-white hover:bg-[#1C5745] active:bg-[#174538] shadow-sm',
          variant === 'secondary' && 'bg-[#EBF5F1] text-[#236B56] hover:bg-[#DDEEE7] active:bg-[#C9E4D9]',
          variant === 'outline' && 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100',
          variant === 'ghost' && 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200/70',
          variant === 'pill' && 'bg-white text-[#236B56] hover:bg-[#F4F5F3] shadow-sm rounded-full',
          variant === 'destructive' && 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-xs rounded-full min-h-[32px]',
          size === 'md' && 'h-10 px-4 text-sm rounded-full min-h-[40px]',
          size === 'lg' && 'h-11 px-6 text-base rounded-full min-h-[44px]',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

