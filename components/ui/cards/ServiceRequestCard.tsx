'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, Calendar, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export type RequestStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceRequestCardProps {
  id: string;
  serviceTitle: string;
  serviceCategory: string;
  areaBn: string;
  requestedDate: string;
  scheduledTime?: string;
  status: RequestStatus;
  estimatedPrice?: string;
  providerName?: string;
  notes?: string;
  detailHref?: string;
  onCancel?: (id: string) => void;
  className?: string;
}

export function ServiceRequestCard({
  id,
  serviceTitle,
  serviceCategory,
  areaBn,
  requestedDate,
  scheduledTime,
  status,
  estimatedPrice,
  providerName,
  notes,
  detailHref,
  onCancel,
  className,
}: ServiceRequestCardProps) {
  const statusConfig: Record<
    RequestStatus,
    { label: string; variant: 'pending' | 'completed' | 'verified' | 'neutral' | 'emergency' }
  > = {
    pending: { label: 'অপেক্ষমান (Pending)', variant: 'pending' },
    confirmed: { label: 'অনুমোদিত (Confirmed)', variant: 'verified' },
    in_progress: { label: 'চলমান (In Progress)', variant: 'neutral' },
    completed: { label: 'সম্পন্ন (Completed)', variant: 'completed' },
    cancelled: { label: 'বাতিল (Cancelled)', variant: 'emergency' },
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs transition-all hover:border-slate-300',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              {serviceCategory}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              আইডি: {id}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-base mt-1">
            {serviceTitle}
          </h4>
        </div>

        <Badge variant={statusConfig[status].variant} size="md">
          {statusConfig[status].label}
        </Badge>
      </div>

      <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>এলাকা: <strong>{areaBn}</strong></span>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>তারিখ: {requestedDate} {scheduledTime && `(${scheduledTime})`}</span>
        </div>

        {providerName && (
          <div className="flex items-center gap-1.5 sm:col-span-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>অ্যাসাইনকৃত টেকনিশিয়ান/প্রোভাইডার: <strong>{providerName}</strong></span>
          </div>
        )}

        {notes && (
          <div className="sm:col-span-2 text-slate-500 italic mt-0.5">
            মন্তব্য: &ldquo;{notes}&rdquo;
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {estimatedPrice ? (
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">আনুমানিক চার্জ</span>
            <span className="text-sm font-bold text-slate-900">{estimatedPrice}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">চার্জ যাচাই প্রক্রিয়ায়</div>
        )}

        <div className="flex items-center gap-2">
          {status === 'pending' && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(id)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
            >
              অনুরোধ বাতিল
            </button>
          )}

          {detailHref ? (
            <Link
              href={detailHref}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
            >
              <span>বিস্তারিত</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
              সক্রিয় অনুরোধ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
