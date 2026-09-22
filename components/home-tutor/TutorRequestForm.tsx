'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Clock,
  Coins,
  User,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import LocationSelectInput from '@/components/LocationSelectInput';
import { TUTOR_CLASSES, TUTOR_SUBJECTS, TUTOR_TEACHING_MODES } from '@/lib/filter-definitions';
import { formatTutorFee } from '@/lib/home-tutor-types';

const TIME_SLOTS = [
  'সকাল (৯টা – ১২টা)',
  'দুপুর (১২টা – ৩টা)',
  'বিকেল (৩টা – ৬টা)',
  'সন্ধ্যা (৬টা – ৮টা)',
  'সন্ধ্যার পর (৮টা – ১০টা)',
  'যেকোনো সময়',
];

const BUDGET_OPTIONS = ['২,০০০৳ এর কম', '২,০০০ – ৪,০০০৳', '৪,০০০ – ৬,০০০৳', '৬,০০০৳ এর বেশি', 'আলোচনা সাপেক্ষে'];

interface TutorRequestFormProps {
  tutor: HomeTutorProfile;
}

export default function TutorRequestForm({ tutor }: TutorRequestFormProps) {
  const { user, createServiceRequest } = useAuth();

  const [areaId, setAreaId] = useState('');
  const [classLevel, setClassLevel] = useState('middle');
  const [subject, setSubject] = useState('math');
  const [mode, setMode] = useState('both');
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[2]);
  const [budget, setBudget] = useState(BUDGET_OPTIONS[2]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <GraduationCap className="w-10 h-10 text-emerald-700 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900">টিউশন রিকোয়েস্ট পাঠাতে লগইন করুন</h3>
        <p className="text-xs text-slate-600 mt-1.5">
          {tutor.fullName} এর প্রোফাইলে রিকোয়েস্ট পাঠাতে ময়মনসিংহ সেবা অ্যাকাউন্ট লাগবে।
        </p>
        <Link
          href={`/login?redirect=/home-tutor/${tutor.id}`}
          className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
        >
          লগইন করুন
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 text-lg">আপনার Tutor Request পাঠানো হয়েছে</h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          অ্যাডমিন টিম আপনার রিকোয়েস্ট যাচাই করে <strong>{tutor.fullName}</strong> এর সাথে যোগাযোগ
          সমন্বয় করবে। স্ট্যাটাস <Link href="/profile/requests" className="font-semibold text-emerald-800 underline">আমার রিকোয়েস্ট</Link> পেজে দেখতে পারবেন।
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId) return;
    setLoading(true);
    const classLabel = TUTOR_CLASSES.find((c) => c.id === classLevel)?.labelBn || classLevel;
    const subjectLabel = TUTOR_SUBJECTS.find((s) => s.id === subject)?.labelBn || subject;
    const modeLabel = TUTOR_TEACHING_MODES.find((m) => m.id === mode)?.labelBn || mode;
    await createServiceRequest({
      serviceSlug: 'home-tutor',
      areaId,
      addressLine: '',
      contactName: user.fullName,
      contactPhone: user.phone,
      preferredTime,
      serviceType: subject,
      profileId: tutor.id,
      profileTitleBn: tutor.fullName,
      details: [
        `শ্রেণি: ${classLabel}`,
        `বিষয়: ${subjectLabel}`,
        `মাধ্যম: ${modeLabel}`,
        `মাসিক বাজেট: ${budget}`,
        note ? `অতিরিক্ত নোট: ${note}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Send className="w-4 h-4 text-emerald-800" />
        <h3 className="font-bold text-slate-900">Tutor Request পাঠান</h3>
      </div>
      <p className="text-xs text-slate-600 mb-5">
        আপনার রিকোয়েস্ট অ্যাডমিন টিম ভেরিফাই করে শিক্ষকের সাথে সমন্বয় করবে। শিক্ষকের নম্বর কখনোই
        প্রকাশ করা হয় না।
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            আপনার নাম
          </label>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{user.fullName}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            যোগাযোগের নম্বর
          </label>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{user.phone}</span>
          </div>
        </div>

        <div>
          <LocationSelectInput
            value={areaId || null}
            onChange={(value) => setAreaId(value ?? '')}
            label="পড়ানোর এলাকা *"
            placeholder="এলাকা নির্বাচন করুন"
            size="md"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              শিক্ষার্থীর শ্রেণি
            </label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {TUTOR_CLASSES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.labelBn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              বিষয়
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {TUTOR_SUBJECTS.filter((s) => s.id !== 'all').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.labelBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              পড়ানোর মাধ্যম
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {TUTOR_TEACHING_MODES.filter((m) => m.id !== 'all').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.labelBn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              পছন্দের সময়
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            মাসিক বাজেট
          </label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            শিক্ষকের প্রত্যাশিত বেতন: <strong>{formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax)}</strong>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            অতিরিক্ত তথ্য (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="যেমন: মহিলা শিক্ষিকা হলে ভালো, দুর্বল গণিতের ভিত্তি আছে..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {!areaId && (
          <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>রিকোয়েস্ট পাঠাতে আগে এলাকা নির্বাচন করুন।</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !areaId}
          className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{loading ? 'পাঠানো হচ্ছে...' : 'Tutor Request পাঠান'}</span>
        </button>

        <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
          <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          অ্যাডমিন ভেরিফিকেশন শেষে সাধারণত ২৪ ঘণ্টার মধ্যে যোগাযোগ করা হয়।
        </p>
      </form>
    </div>
  );
}