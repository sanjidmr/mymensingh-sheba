'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Flag, CheckCircle2, Loader2 } from 'lucide-react';
import { createBloodDonorReport } from '@/lib/blood-donor-service';
import { cn } from '@/lib/utils';

const DONOR_REPORT_REASONS = [
  'ভুয়া / মিথ্যা প্রোফাইল',
  'রক্তদানে অনিয়মিত / ভুল তথ্য',
  'রক্ত কেনা-বেচায় জড়িত',
  'অনুপযুক্ত আচরণ',
  'অন্য কারণ',
];

interface DonorReportSheetProps {
  open: boolean;
  onClose: () => void;
  donorId: string;
  donorName: string;
  user: { id?: string; fullName?: string } | null;
}

export function DonorReportSheet({ open, onClose, donorId, donorName, user }: DonorReportSheetProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('অনুগ্রহ করে কারণ নির্বাচন করুন।');
      return;
    }
    setSending(true);
    setError('');
    const result = await createBloodDonorReport({
      donorProfileId: donorId,
      reporterName: user?.fullName || 'অতিথি',
      reason,
      details: details.trim(),
    });
    setSending(false);
    if (result.success) setDone(true);
    else setError(result.error || 'রিপোর্ট পাঠাতে ব্যর্থ হয়েছে।');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Flag className="w-4 h-4 text-rose-600" />
            <span>রক্তদাতা প্রোফাইল রিপোর্ট করুন</span>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="বন্ধ করুন">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
              <div className="font-bold mb-1">রিপোর্ট জমা হয়েছে</div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                অ্যাডমিন টিম বিষয়টি পর্যালোচনা করবে। আপনার রিপোর্টের জন্য ধন্যবাদ।
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                {donorName} প্রোফাইলে কোনো সমস্যা থাকলে নিচের ফর্মটি পূরণ করুন। ভুয়া রিপোর্টেরও ব্যবস্থা নেওয়া হবে।
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">কারণ *</label>
                <div className="space-y-2">
                  {DONOR_REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setReason(r);
                        setError('');
                      }}
                      className={cn(
                        'w-full p-3 rounded-xl text-xs font-semibold border text-left transition-colors',
                        reason === r
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : 'bg-white text-slate-700 border-slate-200'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত (ঐচ্ছিক):</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="কী সমস্যা হচ্ছে তা সংক্ষেপে লিখুন..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              {!user && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                  আপনি লগইন না করেই রিপোর্ট পাঠাতে পারবেন।{' '}
                  <Link href="/login" className="text-rose-700 font-semibold underline">
                    লগইন
                  </Link>{' '}
                  করলে রিপোর্টের সাথে অ্যাকাউন্ট যুক্ত থাকবে।
                </p>
              )}

              {error && <p className="text-xs text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                <span>{sending ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট পাঠান'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}