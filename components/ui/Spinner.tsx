import { cn } from '@/lib/utils';

export interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SPINNER_SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-9 w-9 border-4',
} as const;

export function Spinner({ label = 'লোড হচ্ছে', size = 'md', className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn('animate-spin rounded-full border-[var(--ui-border)] border-t-[var(--ui-primary)]', SPINNER_SIZES[size], className)}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
