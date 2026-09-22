'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface ServiceCategoryCardProps {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  badgeText?: string;
  isEmergency?: boolean;
  managedByAdmin?: boolean;
  className?: string;
}

export function ServiceCategoryCard({
  title,
  subtitle,
  href,
  icon,
  badgeText,
  isEmergency = false,
  managedByAdmin = false,
  className,
}: ServiceCategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 transition-all duration-150',
        'hover:border-emerald-700/60 hover:shadow-md active:scale-[0.99] select-none',
        isEmergency
          ? 'border-rose-200/90 bg-rose-50/10 hover:border-rose-300'
          : '',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
            isEmergency
              ? 'bg-rose-50 text-rose-700 border border-rose-200/80 group-hover:bg-rose-100'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-100 group-hover:bg-emerald-100'
          )}
        >
          {icon}
        </div>

        <div className="flex items-center gap-1.5">
          {badgeText && (
            <Badge
              variant={isEmergency ? 'emergency' : 'verified'}
              size="sm"
            >
              {badgeText}
            </Badge>
          )}

          {managedByAdmin && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              অ্যাডমিন পরিচালিত
            </span>
          )}
        </div>
      </div>

      <div className="mt-3.5">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-emerald-900 transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span
          className={cn(
            'transition-colors',
            isEmergency
              ? 'text-rose-700 group-hover:text-rose-800'
              : 'text-emerald-800 group-hover:text-emerald-950'
          )}
        >
          সেবা দেখুন
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
