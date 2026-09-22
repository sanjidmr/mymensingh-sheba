'use client';

import { TOLET_LISTING_STATUS_INFO, type ToletListingStatus } from '@/lib/tolet-types';
import { cn } from '@/lib/utils';

interface ListingStatusBadgeProps {
  status: ToletListingStatus;
  className?: string;
}

export function ListingStatusBadge({ status, className }: ListingStatusBadgeProps) {
  const info = TOLET_LISTING_STATUS_INFO[status] || TOLET_LISTING_STATUS_INFO.draft;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap',
        info.badgeClass,
        className
      )}
    >
      {info.labelBn}
    </span>
  );
}

export function RequestStatusBadge({
  status,
}: {
  status: 'submitted' | 'contacted' | 'completed' | 'cancelled';
}) {
  const map: Record<string, { labelBn: string; badgeClass: string }> = {
    submitted: { labelBn: 'অপেক্ষমাণ', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200' },
    contacted: { labelBn: 'যোগাযোগ হয়েছে', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
    completed: { labelBn: 'সম্পন্ন', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
    cancelled: { labelBn: 'বাতিল', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const info = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap',
        info.badgeClass
      )}
    >
      {info.labelBn}
    </span>
  );
}