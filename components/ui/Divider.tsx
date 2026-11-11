import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  label?: string;
}

export function Divider({ label, className, ...props }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3 text-sm text-text-muted', className)}>
        <hr aria-hidden="true" className="flex-1 border-0 border-t border-[var(--ui-border)]" />
        <span>{label}</span>
        <hr aria-hidden="true" className="flex-1 border-0 border-t border-[var(--ui-border)]" />
      </div>
    );
  }
  return <hr {...props} className={cn('border-0 border-t border-[var(--ui-border)]', className)} />;
}
