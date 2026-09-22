'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Settings,
  Coins,
  ToggleLeft,
  ToggleRight,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { fetchPlatformSettings, savePlatformSettings, type PlatformSettings } from '@/lib/admin-service';
import type { ToletFeeRules } from '@/lib/tolet-fees';

const DEFAULT_TOLET_FEE_RULES: ToletFeeRules = {
  messSeatFee: 50,
  tier1Max10k: 100,
  tier2Max20k: 200,
  tier3Above20k: 400,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feeRules, setFeeRules] = useState<ToletFeeRules>(DEFAULT_TOLET_FEE_RULES);

  useEffect(() => {
    let active = true;
    fetchPlatformSettings()
      .then((data) => {
        if (active) {
          setSettings(data);
          setFeeRules(data.toletFeeRules);
        }
      })
      .catch(() => {
        if (active) setError('সেটিংস লোড ব্যর্থ হয়েছে');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleFeeChange = (field: keyof ToletFeeRules, value: number) => {
    setFeeRules((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const handleToggleService = (service: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev!,
      serviceAvailability: { ...prev!.serviceAvailability, [service]: enabled },
    }));
  };

  const handleToggleNotification = (key: keyof PlatformSettings['notificationSettings'], enabled: boolean) => {
    setSettings((prev) => ({
      ...prev!,
      notificationSettings: { ...prev!.notificationSettings, [key]: enabled },
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await savePlatformSettings({
      toletFeeRules: feeRules,
      serviceAvailability: settings.serviceAvailability,
      notificationSettings: settings.notificationSettings,
    });
    setSaving(false);
    if (res.success) {
      setSuccess('সেটিংস সফলভাবে সংরক্ষিত হয়েছে');
    } else {
      setError(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span className="text-sm">সেটিংস লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  const serviceConfig = [
    { key: 'tolet', label: 'বাসা ভাড়া (To-Let)', icon: '🏠' },
    { key: 'home-tutor', label: 'গৃহশিক্ষক', icon: '📚' },
    { key: 'home-moving', label: 'বাসা পাল্টানো', icon: '🚚' },
    { key: 'kajerBua', label: 'কাজের বুয়া', icon: '🧹' },
    { key: 'electrician', label: 'ইলেক্ট্রিশিয়ান', icon: '⚡' },
    { key: 'plumber', label: 'প্লাম্বার', icon: '🔧' },
  ] as const;

  const notificationConfig = [
    { key: 'notifyOnRequestSubmitted', label: 'নতুন রিকোয়েস্ট জমা', desc: 'গ্রাহক রিকোয়েস্ট জমা দিলে সতর্ক করুন' },
    { key: 'notifyOnStatusChange', label: 'স্ট্যাটাস পরিবর্তন', desc: 'রিকোয়েস্ট স্ট্যাটাস বদলে সতর্ক করুন' },
    { key: 'notifyAdminOnNewRequest', label: 'অ্যাডমিনকে নতুন রিকোয়েস্ট', desc: 'নতুন রিকোয়েস্টে অ্যাডমিনকে নোটিফাই করুন' },
    { key: 'notifyCustomerOnStatusChange', label: 'গ্রাহকে স্ট্যাটাস আপডেট', desc: 'স্ট্যাটাস বদলে গ্রাহককে নোটিফাই করুন' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800">
              <ArrowLeft className="w-3.5 h-3.5" /> অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">প্ল্যাটফর্ম সেটিংস</h1>
            <p className="text-xs text-slate-500 mt-1">ব্যবসায়িক নিয়ম, সার্ভিস উপলব্ধতা ও নোটিফিকেশন কনফিগারেশন</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        <div className="space-y-6">
          {/* To-Let Fee Rules */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">টু-লেট প্ল্যাটফর্ম ফি স্ল্যাব</h2>
                <p className="text-xs text-slate-500">এই মানগুলো বাসা ভাড়া করার সময় প্ল্যাটফর্ম ফি হিসাবের জন্য ব্যবহৃত হয়।</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">মেস / হোস্টেল / সিট (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={feeRules.messSeatFee}
                  onChange={(e) => handleFeeChange('messSeatFee', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">নির্দিষ্ট ফি</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">ভাড়া ১০,০০০ পর্যন্ত (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={feeRules.tier1Max10k}
                  onChange={(e) => handleFeeChange('tier1Max10k', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">টিয়ার ১</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">ভাড়া ১০,০০১ - ২০,০০০ (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={feeRules.tier2Max20k}
                  onChange={(e) => handleFeeChange('tier2Max20k', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">টিয়ার ২</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">ভাড়া ২০,০০০ এর উপরে (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={feeRules.tier3Above20k}
                  onChange={(e) => handleFeeChange('tier3Above20k', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">টিয়ার ৩</p>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">সার্ভিস উপলব্ধতা</h2>
                <p className="text-xs text-slate-500">এখান থেকে সার্ভিসগুলো পাবলিকলি এক্সেসযোগ্য আছে কিনা নিয়ন্ত্রণ করুন।</p>
              </div>
            </div>
            <div className="space-y-3">
              {serviceConfig.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-medium text-slate-900 text-sm">{label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleService(key, !settings?.serviceAvailability[key])}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings?.serviceAvailability[key] ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label={settings?.serviceAvailability[key] ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  >
                    <span
                      className={`absolute top-0.5 transition-transform w-5 h-5 rounded-full bg-white shadow ${
                        settings?.serviceAvailability[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Notification Settings */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">নোটিফিকেশন সেটিংস</h2>
                <p className="text-xs text-slate-500">কোন ইভেন্টে কোন কার্যকর্তাকে নোটিফাই করা হবে তা নির্ধারণ করুন।</p>
              </div>
            </div>
            <div className="space-y-3">
              {notificationConfig.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{label}</p>
                    <p className="text-[11px] text-slate-500">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(key, !settings?.notificationSettings[key])}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings?.notificationSettings[key] ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                    aria-label={settings?.notificationSettings[key] ? 'বন্ধ করুন' : 'চালু করুন'}
                  >
                    <span
                      className={`absolute top-0.5 transition-transform w-5 h-5 rounded-full bg-white shadow ${
                        settings?.notificationSettings[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}