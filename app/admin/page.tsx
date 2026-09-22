'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Home,
  Sparkles,
  Zap,
  Truck,
  Heart,
  Users,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  Settings,
  MapPin,
  Clipboard,
  GraduationCap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { fetchAdminDashboardStats } from '@/lib/admin-service';
import type { AdminDashboardStats } from '@/lib/admin-types';

const adminModules = [
  {
    title: 'বασা ভাড়া (To-Let) ম্যানেজমেন্ট',
    desc: 'বিজ্ঞাপন অনুমোদন, ফি কনফিগারেশন (৫০৳, ১০০৳, ২০০৳, ৪০০৳) ও মালিক ভেরিফিকেশন।',
    icon: Home,
    href: '/admin/tolet',
    tag: 'বিজনেস রুলস',
  },
  {
    title: 'কর্মী সার্ভিস ম্যানেজমেন্ট',
    desc: 'কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার — প্রোফাইল যোগ, ভেরিফিকেশন, বুকিং মনিটরিং।',
    icon: Sparkles,
    href: '/admin/services',
    tag: 'অ্যাডমিন পরিচালিত',
  },
  {
    title: 'বাসা পাল্টানো (Home Moving)',
    desc: 'গ্রাহকের শিফটিং রিকোয়েস্ট, এলাকা/তারিখ/স্ট্যাটাস ফিল্টার, কোয়োটেশন ও মনিটরিং।',
    icon: Truck,
    href: '/admin/requests',
    tag: 'অ্যাডমিন পরিচালিত',
  },
  {
    title: 'গৃহশিক্ষক ভেরিফিকেশন',
    desc: 'টিউটর প্রোফাইল যাচাই, অনুমোদন/প্রত্যাখ্যান, ব্যক্তিগত নম্বর দেখা ও মডারেশন নোট।',
    icon: GraduationCap,
    href: '/admin/verifications',
    tag: 'প্রাইভেসি ও ভেরিফিকেশন',
  },
  {
    title: 'জরুরি রক্ত রিকোয়েস্ট মডারেশন',
    desc: 'রোগীর প্রেসক্রিপশন যাচাই ও রক্তদাতার সাথে সুরক্ষিত যোগাযোগ অনুমোদন।',
    icon: Heart,
    href: '/admin/blood',
    tag: 'প্রাইভেসি ও ভেরিফিকেশন',
  },
  {
    title: 'ইউজার ও প্রোফাইল ডাটাবেজ',
    desc: 'গ্রাহক অ্যাকাউন্ট ও অ্যাক্টিভেটেড সার্ভিস প্রোফাইল (মালিক, টিউটর, রক্তদাতা)।',
    icon: Users,
    href: '/admin/users',
    tag: 'One Account System',
  },
  {
    title: 'মডারেশন রিপোর্ট হাব',
    desc: 'সব রিপোর্ট (বিজ্ঞাপন, কর্মী, টিউটর, রক্তদাতা) এক জায়গায় রিভিউ ও রেজলভ।',
    icon: AlertCircle,
    href: '/admin/reports',
    tag: 'মডারেশন',
  },
  {
    title: 'রিভিউ মডারেশন',
    desc: 'গৃহশিক্ষক রিভিউ অনুমোদন/অনুপ্রকাশন এবং মডারেশন লগ।',
    icon: CheckCircle2,
    href: '/admin/reviews',
    tag: 'মডারেশন',
  },
  {
    title: 'অ্যাডমিন নোটিফিকেশন হাব',
    desc: 'নতুন রিকোয়েস্ট, রিপোর্ট, ভেরিফিকেশন রিকোয়েস্টের সারসংক্ষেপ ও পঠিত চিহ্নিত।',
    icon: Settings,
    href: '/admin/notifications',
    tag: 'নোটিফিকেশন',
  },
  {
    title: 'প্ল্যাটফর্ম সেটিংস',
    desc: 'টু-লেট ফি স্ল্যাব, সার্ভিস উপলব্ধতা, নোটিফিকেশন সেটিংস কনফিগারেশন।',
    icon: Settings,
    href: '/admin/settings',
    tag: 'কনফিগারেশন',
  },
];

const statCards = [
  { key: 'users', label: 'মোট ইউজার', icon: Users, color: 'bg-slate-50 border-slate-200 text-slate-900' },
  { key: 'pendingVerifications', label: 'পেন্ডিং ভেরিফিকেশন', icon: ShieldAlert, color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { key: 'publishedTutors', label: 'সক্রিয় টিউটর', icon: GraduationCap, color: 'bg-teal-50 border-teal-200 text-teal-900' },
  { key: 'publishedDonors', label: 'সক্রিয় রক্তদাতা', icon: Heart, color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { key: 'activeStaff', label: 'সক্রিয় কর্মী', icon: Sparkles, color: 'bg-violet-50 border-violet-200 text-violet-900' },
  { key: 'openRequests', label: 'চলমান রিকোয়েস্ট', icon: Clipboard, color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { key: 'bloodPending', label: 'রক্ত রিকোয়েস্ট (পেন্ডিং)', icon: Heart, color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { key: 'openReports', label: 'খোলা রিপোর্ট', icon: AlertCircle, color: 'bg-red-50 border-red-200 text-red-900' },
  { key: 'unreadAdminNotifs', label: 'অনপঠিত নোটিফিকেশন', icon: Settings, color: 'bg-sky-50 border-sky-200 text-sky-900' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAdminDashboardStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setError('স্ট্যাট লোড ব্যর্থ হয়েছে');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            <span className="text-sm">অ্যাডমিন ড্যাশবোর্ড লোড হচ্ছে...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">অ্যাডমিন কন্ট্রোল সেন্টার</h1>
            <p className="text-xs text-slate-500 mt-1">
              রিয়েল-টাইম ড্যাশবোর্ড — সকল আঙ্ক্ড়ে লাইভ ডেটাবেজ থেকে
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {statCards.map((card) => (
            <Link
              key={card.key}
              href={card.key === 'unreadAdminNotifs' ? '/admin/notifications' :
                   card.key === 'pendingVerifications' ? '/admin/verifications' :
                   card.key === 'bloodPending' ? '/admin/blood' :
                   card.key === 'openReports' ? '/admin/reports' :
                   card.key === 'openRequests' ? '/admin/requests' :
                   card.key === 'activeStaff' ? '/admin/services' :
                   card.key === 'publishedTutors' ? '/admin/verifications' :
                   card.key === 'publishedDonors' ? '/admin/blood' :
                   '/admin/users'}
              className={`p-4 rounded-2xl border ${card.color} hover:shadow-xs transition-shadow block`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-black">{stats?.[card.key as keyof AdminDashboardStats] ?? 0}</span>
                <card.icon className="w-5 h-5 opacity-50" />
              </div>
              <div className="text-xs font-bold mt-2">{card.label}</div>
            </Link>
          ))}
        </div>

        {/* Management Modules Grid */}
        <h3 className="text-lg font-bold text-slate-900 mb-4">ম্যানেজমেন্ট মডিউলসমূহ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminModules.map((m, i) => {
            const Icon = m.icon;
            return (
              <Link
                key={i}
                href={m.href}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-700/40 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {m.tag}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>ম্যানেজ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}