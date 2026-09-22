import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, Sparkles, XCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'verified'
  | 'available'
  | 'new'
  | 'featured'
  | 'pending'
  | 'completed'
  | 'closed'
  | 'emergency'
  | 'neutral'
  | 'info';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  showDefaultIcon?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  icon,
  showDefaultIcon = true,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    verified: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold',
    available: 'bg-teal-50 text-teal-800 border-teal-200/90 font-medium',
    new: 'bg-lime-50 text-lime-900 border-lime-200/90 font-semibold',
    featured: 'bg-amber-50 text-amber-900 border-amber-200/90 font-semibold',
    pending: 'bg-amber-50 text-amber-800 border-amber-200/90 font-medium',
    completed: 'bg-blue-50 text-blue-800 border-blue-200/90 font-medium',
    closed: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    emergency: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    info: 'bg-sky-50 text-sky-800 border-sky-200 font-medium',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 rounded-md leading-tight',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg leading-tight',
  };

  const defaultIcons: Partial<Record<BadgeVariant, React.ReactNode>> = {
    verified: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />,
    available: <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse shrink-0" />,
    new: <Sparkles className="w-3 h-3 text-lime-700 shrink-0" />,
    featured: <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />,
    pending: <Clock className="w-3 h-3 text-amber-600 shrink-0" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
    closed: <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
    emergency: <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />,
    info: <AlertCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
  };

  const renderedIcon = icon || (showDefaultIcon ? defaultIcons[variant] : null);

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none whitespace-nowrap tracking-tight',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {renderedIcon}
      <span>{children}</span>
    </span>
  );
}
