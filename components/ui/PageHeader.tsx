import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, backHref, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex min-w-0 items-start gap-3 py-4 sm:py-6', className)}>
      {backHref && (
        <Link href={backHref} aria-label="পেছনে যান" className="ui-button-icon ui-pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-tight text-text sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
