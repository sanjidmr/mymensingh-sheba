import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'card' | 'image' | 'list';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  lines?: number;
  className?: string;
}

function SkeletonLine({ className }: { className?: string }) {
  return <span className={cn('block h-3 animate-pulse rounded-full bg-[var(--ui-surface-muted)]', className)} />;
}

export function Skeleton({
  variant = 'text',
  count = 3,
  lines = 2,
  className,
}: SkeletonProps) {
  if (variant === 'image') {
    return <span aria-hidden="true" className={cn('block aspect-[4/3] w-full animate-pulse rounded-2xl bg-[var(--ui-surface-muted)]', className)} />;
  }

  if (variant === 'card') {
    return (
      <span aria-hidden="true" className={cn('ui-card block animate-pulse p-4', className)}>
        <span className="mb-4 block aspect-[16/10] rounded-xl bg-[var(--ui-surface-muted)]" />
        <SkeletonLine className="mb-3 w-3/4" />
        <SkeletonLine className="w-1/2" />
      </span>
    );
  }

  if (variant === 'list') {
    return (
      <span aria-label="তথ্য লোড হচ্ছে" role="status" className={cn('block space-y-3', className)}>
        {Array.from({ length: Math.max(0, count) }, (_, index) => (
          <span key={index} aria-hidden="true" className="ui-card flex animate-pulse items-center gap-3 p-3">
            <span className="h-12 w-12 shrink-0 rounded-full bg-[var(--ui-surface-muted)]" />
            <span className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="w-2/3" />
              <SkeletonLine className="w-1/2" />
            </span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span aria-label="তথ্য লোড হচ্ছে" role="status" className={cn('block space-y-2', className)}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <SkeletonLine key={index} className={index === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </span>
  );
}
