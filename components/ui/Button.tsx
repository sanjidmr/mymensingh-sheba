'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'important'
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
      'ui-pressable inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none active:transition-none whitespace-nowrap';

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'ui-button-primary shadow-sm',
      important:
        'bg-accent-400 text-ink-950 hover:bg-accent-500 shadow-sm',
      secondary: 'ui-button-secondary',
      outline: 'ui-button-outline',
      ghost: 'ui-button-ghost',
      danger: 'ui-button-danger shadow-sm',
      success: 'bg-status-success text-white shadow-sm',
      icon: 'ui-button-icon p-2.5',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs h-11 px-3 gap-1.5 min-h-[44px] min-w-[44px]',
      md: 'text-sm h-11 px-4 gap-2 min-h-[44px] min-w-[44px]',
      lg: 'text-base h-12 sm:h-13 px-5 sm:px-6 gap-2.5 min-h-[48px]',
    };

    const iconOnlySizeStyles: Record<ButtonSize, string> = {
      sm: 'h-11 w-11 p-0 min-h-[44px] min-w-[44px]',
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
        data-button-variant={variant}
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
