import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, kicker, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex min-w-0 items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {kicker && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">{kicker}</p>}
        <h2 className="text-xl font-bold leading-snug text-text sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
