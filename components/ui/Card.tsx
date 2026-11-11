import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ children, className, interactive = false, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'ui-card min-w-0 overflow-hidden rounded-2xl',
        interactive ? 'ui-pressable transition-shadow hover:shadow-lg' : '',
        className
      )}
    >
      {children}
    </div>
  );
}
