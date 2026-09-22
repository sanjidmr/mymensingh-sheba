'use client';

import React from 'react';
import { SearchX, Inbox, HeartOff, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type EmptyStateType = 'search' | 'requests' | 'saved' | 'general';

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  type = 'general',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  const defaults: Record<
    EmptyStateType,
    { title: string; description: string; defaultIcon: React.ReactNode }
  > = {
    search: {
      title: 'কিছু পাওয়া যায়নি',
      description: 'আপনার নির্বাচিত এলাকা বা ফিল্টারে কোনো ফলাফল পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।',
      defaultIcon: <SearchX className="w-8 h-8 text-slate-400" />,
    },
    requests: {
      title: 'এখনো কোনো Request নেই',
      description: 'আপনি এখনো কোনো সেবার জন্য আবেদন করেননি। প্রয়োজনীয় সেবা নির্বাচন করে বুকিং রিকোয়েস্ট পাঠান।',
      defaultIcon: <Inbox className="w-8 h-8 text-slate-400" />,
    },
    saved: {
      title: 'কোনো সংরক্ষিত আইটেম নেই',
      description: 'আপনার পছন্দের বাসা ভাড়া বা প্রোভাইডার সেভ করতে কার্ডের হার্ট আইকনে ক্লিক করুন।',
      defaultIcon: <HeartOff className="w-8 h-8 text-slate-400" />,
    },
    general: {
      title: 'কোনো তথ্য নেই',
      description: 'এই বিভাগে বর্তমানে কোনো তথ্য বা তালিকা প্রদর্শনের জন্য নেই।',
      defaultIcon: <FileQuestion className="w-8 h-8 text-slate-400" />,
    },
  };

  const finalTitle = title || defaults[type].title;
  const finalDesc = description || defaults[type].description;
  const finalIcon = icon || defaults[type].defaultIcon;

  return (
    <div
      className={cn(
        'w-full py-12 sm:py-16 px-6 rounded-3xl bg-white border border-slate-200/90 text-center flex flex-col items-center justify-center max-w-md mx-auto my-4',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-4 text-slate-500">
        {finalIcon}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
        {finalTitle}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mb-5">
        {finalDesc}
      </p>

      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
