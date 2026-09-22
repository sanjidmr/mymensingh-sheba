'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'icon';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles: mobile-first >= 44px min touch target on default size, visible focus
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] active:transition-none whitespace-nowrap';

    const variantStyles: Record<ButtonVariant, string> = {
      // Primary: Deep trustworthy Green
      primary:
        'bg-emerald-800 text-white hover:bg-emerald-900 active:bg-emerald-950 focus-visible:ring-emerald-700 shadow-xs',
      // Secondary: Soft light green tint
      secondary:
        'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200/80 focus-visible:ring-emerald-600 border border-emerald-200/80',
      // Outline: Slate border with clean hover
      outline:
        'bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 border border-slate-300/90 active:bg-slate-100 focus-visible:ring-emerald-700 shadow-2xs',
      // Ghost: Borderless
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 focus-visible:ring-emerald-700',
      // Danger: Soft or solid red for cancel/delete/report
      danger:
        'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus-visible:ring-rose-600 shadow-xs',
      // Success: Vibrant confirmation
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-600 shadow-xs',
      // Icon: Square/circle button
      icon:
        'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 active:bg-slate-200/70 focus-visible:ring-emerald-700 p-2.5',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs h-9 px-3 gap-1.5 min-w-[36px]',
      // md is 44px min-height to ensure touch target compliance
      md: 'text-sm h-11 px-4 gap-2 min-h-[44px] min-w-[44px]',
      lg: 'text-base h-12 sm:h-13 px-5 sm:px-6 gap-2.5 min-h-[48px]',
    };

    const iconOnlySizeStyles: Record<ButtonSize, string> = {
      sm: 'h-9 w-9 p-0',
      md: 'h-11 w-11 p-0 min-h-[44px] min-w-[44px]',
      lg: 'h-12 w-12 sm:h-13 sm:w-13 p-0',
    };

    const isIconOnly = variant === 'icon';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          isIconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
            {!isIconOnly && (
              <span className="text-current opacity-90">অপেক্ষা করুন...</span>
            )}
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
