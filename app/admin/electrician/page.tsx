'use client';

import React, { useState } from 'react';
import { Zap, PlusCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';

export default function AdminElectricianPage() {
  const [technicians] = useState([
    {
      id: 'tech-1',
      name: 'মো. রফিকুল ইসলাম',
      phone: '01712-345678',
      specialty: 'শর্ট সার্কিট ও ওয়্যারিং বিশেষজ্ঞ',
      experience: '৮ বছর অভিজ্ঞতা',
      status: 'অন ডিউটি',
    },
    {
      id: 'tech-2',
      name: 'মো. জামাল হোসেন',
      phone: '01911-876543',
      specialty: 'মোটর ও গিজার টেকনিশিয়ান',
      experience: '৫ বছর অভিজ্ঞতা',
      status: 'অন ডিউটি',
    },
  ]);

  return (
    <RoutePlaceholderShell
      title="Electrician — অ্যাডমিন কন্ট্রোল"
      subtitle="অ্যাডমিন পরিচালিত টেকনিশিয়ান টিম, মেরামত অনুরোধ এবং শিডিউল মনিটরিং।"
      categoryBadge="অ্যাডমিন পরিচালিত সেবা"
      breadcrumbs={[
        { label: 'অ্যাডমিন', href: '/admin' },
        { label: 'Electrician' },
      ]}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">তালিকাভুক্ত ইলেক্ট্রিক টেকনিশিয়ান</h3>

        <div className="space-y-3">
          {technicians.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                    {t.experience}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{t.specialty}</div>
                <div className="text-[11px] text-slate-400 mt-1">যোগাযোগ: {t.phone} (অভ্যন্তরীণ)</div>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </RoutePlaceholderShell>
  );
}
