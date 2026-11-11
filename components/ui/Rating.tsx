import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  count?: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}

export function Rating({
  value,
  count,
  max = 5,
  className,
  showValue = true,
}: RatingProps) {
  const safeValue = Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
  const roundedValue = Math.round(safeValue * 10) / 10;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-sm', className)}
      aria-label={`${roundedValue} out of ${max} stars${count === undefined ? '' : `, ${count} ratings`}`}
      role="img"
    >
      <span className="inline-flex items-center gap-0.5 text-amber-500" aria-hidden="true">
        {Array.from({ length: max }, (_, index) => (
          <Star
            key={index}
            className="h-4 w-4"
            fill={index < Math.round(safeValue) ? 'currentColor' : 'none'}
            strokeWidth={1.8}
          />
        ))}
      </span>
      {showValue && <span className="font-semibold text-text">{roundedValue.toFixed(1)}</span>}
      {count !== undefined && <span className="text-text-muted">({count})</span>}
    </span>
  );
}
