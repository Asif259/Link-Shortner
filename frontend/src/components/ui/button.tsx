'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#236B56] disabled:pointer-events-none disabled:opacity-50',
          // Variants
          variant === 'primary' && 'bg-[#236B56] text-white hover:bg-[#1C5745] shadow-sm',
          variant === 'secondary' && 'bg-[#EBF5F1] text-[#236B56] hover:bg-[#DDEEE7]',
          variant === 'outline' && 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
          variant === 'ghost' && 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
          variant === 'pill' && 'bg-white text-[#236B56] hover:bg-[#F4F5F3] shadow-sm rounded-full',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-xs rounded-full',
          size === 'md' && 'h-10 px-4 text-sm rounded-full',
          size === 'lg' && 'h-11 px-6 text-base rounded-full',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
