import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  selected?: boolean;
  variant?: 'default' | 'outline' | 'accent';
}

const CHIP_VARIANTS = {
  default: 'ui-surface-muted border-transparent',
  outline: 'ui-surface border-[var(--ui-border)]',
  accent: 'border-transparent bg-accent-100 text-amber-900',
} as const;

export function Chip({
  children,
  selected = false,
  variant = 'default',
  className,
  type = 'button',
  ...props
}: ChipProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      className={cn(
        'ui-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        CHIP_VARIANTS[variant],
        selected ? 'border-brand-600 bg-brand-50 text-brand-800' : '',
        className
      )}
    >
      {children}
    </button>
  );
}
