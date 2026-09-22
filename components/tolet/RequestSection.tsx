'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { createToletRequest } from '@/lib/tolet-service';
import type { UserProfile } from '@/lib/supabase/types';
import { getAllMCCAreas } from '@/lib/locations';

const PREFERRED_TIMES = [
  'সকাল (৯টা – ১২টা)',
  'দুপুর (১২টা – ৩টা)',
  'বিকেল (৩টা – ৬টা)',
  'সন্ধ্যা (৬টা – ৮টা)',
  'যেকোনো সময়',
];

interface RequestSectionProps {
  listingId: string;
  user: UserProfile | null;
}

export function RequestSection({ listingId, user }: RequestSectionProps) {
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visitorName, setVisitorName] = useState(user?.fullName || '');
  const [visitorPhone, setVisitorPhone] = useState(user?.phone || '');
  const [visitorArea, setVisitorArea] = useState(user?.primaryAreaId || '');
  const [preferredTime, setPreferredTime] = useState('');
  const [visitorNote, setVisitorNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRequestError('');
    setSubmitting(true);
    const result = await createToletRequest({
      listingId,
      customerId: user.id,
      customerName: visitorName.trim(),
      customerPhone: visitorPhone.trim(),
      areaId: visitorArea || undefined,
      message: visitorNote.trim(),
      preferredTime: preferredTime || undefined,
    });
    setSubmitting(false);
    if (result.success) setRequestSent(true);
    else setRequestError(result.error || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
        <Lock className="w-4 h-4 text-emerald-700" />
        <span>নিরাপদ যোগাযোগ প্রোটোকল</span>
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-2">বাসা দেখার অনুরোধ পাঠান</h4>
      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        স্প্যাম ও হয়রানি রোধে মালিকের ফোন নম্বর সরাসরি উন্মুক্ত নয়। আপনার অনুরোধ প্ল্যাটফর্মের মাধ্যমে
        বিজ্ঞাপনদাতার কাছে পৌঁছাবে।
      </p>

      {requestSent ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
          <div className="font-bold mb-1">অনুরোধ জমা হয়েছে!</div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            আপনার তথ্য বিজ্ঞাপনদাতার কাছে পাঠানো হয়েছে। তিনি শীঘ্রই যোগাযোগ করবেন।
          </p>
          <Link href="/profile/requests" className="underline font-semibold text-xs inline-block mt-2">
            আমার অনুরোধ দেখুন
          </Link>
        </div>
      ) : !user ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <Lock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            বাসা দেখার অনুরোধ পাঠাতে অ্যাকাউন্টে লগইন করুন। আপনার তথ্য গোপন রাখা হবে।
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/login" className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold">
              লগইন করুন
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-xl border border-emerald-800 text-emerald-900 text-xs font-semibold">
              অ্যাকাউন্ট খুলুন
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার নাম:</label>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="পূর্ণ নাম"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর:</label>
              <input
                type="tel"
                required
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার এলাকা (ঐচ্ছিক):</label>
            <select
              value={visitorArea}
              onChange={(e) => setVisitorArea(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">এলাকা নির্বাচন করুন</option>
              {getAllMCCAreas({ activeOnly: true }).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">পছন্দের সময়:</label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">যেকোনো সময়</option>
              {PREFERRED_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">প্রশ্ন বা নোট (ঐচ্ছিক):</label>
            <textarea
              rows={2}
              value={visitorNote}
              onChange={(e) => setVisitorNote(e.target.value)}
              placeholder="যেমন: শুক্রবার বিকেলে দেখতে চাই..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {requestError && <p className="text-xs text-rose-600">{requestError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{submitting ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}</span>
          </button>
        </form>
      )}
    </div>
  );
}