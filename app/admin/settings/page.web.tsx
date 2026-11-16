'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Settings,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Send,
} from 'lucide-react';
import { fetchPlatformSettings, savePlatformSettings, type PlatformSettings } from '@/lib/admin-service';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import { useAuth } from '@/lib/auth-context';

export default function AdminSettingsPage() {
  const { changePassword, hasPassword } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [telegramBusy, setTelegramBusy] = useState<'health' | 'suite' | null>(null);
  const [telegramMessage, setTelegramMessage] = useState('');
  const [telegramMessageIsError, setTelegramMessageIsError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPlatformSettings()
      .then((data) => {
        if (active) {
          setSettings(data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'সেটিংস লোড ব্যর্থ হয়েছে');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

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

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
      setPasswordError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('নতুন পাসওয়ার্ড দুটি মিলছে না।');
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await changePassword(newPassword, hasPassword ? currentPassword : undefined);
      if (!result.success) {
        setPasswordError(result.error || 'পাসওয়ার্ড পরিবর্তন করা যায়নি।');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('অ্যাডমিনের পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'পাসওয়ার্ড পরিবর্তন করা যায়নি।');
    } finally {
      setPasswordSaving(false);
    }
  };

  const runTelegramAction = async (action: 'health' | 'suite') => {
    setTelegramBusy(action);
    setTelegramMessage('');
    setTelegramMessageIsError(false);
    try {
      const response = await fetch(
        action === 'health'
          ? '/api/admin-telegram-alerts/health'
          : '/api/admin-telegram-alerts/test-suite',
        { method: 'POST' }
      );
      const result: unknown = await response.json();
      if (!result || typeof result !== 'object') {
        const message =
          result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Telegram পরীক্ষা সম্পন্ন হয়নি।';
        throw new Error(message);
      }
      if (action === 'health') {
        if (!response.ok) {
          const message = 'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Telegram health check failed.';
          throw new Error(message);
        }
        const bot =
          'bot' in result && typeof result.bot === 'string' ? ` (${result.bot})` : '';
        setTelegramMessage(`Bot token ও chat ID যাচাই হয়েছে${bot}।`);
      } else {
        const sent = 'sent' in result && typeof result.sent === 'number' ? result.sent : 0;
        const failed = 'failed' in result && typeof result.failed === 'number' ? result.failed : 0;
        const failures =
          'results' in result && Array.isArray(result.results)
            ? result.results
                .filter(
                  (entry): entry is { type: string; ok: false } =>
                    !!entry &&
                    typeof entry === 'object' &&
                    'type' in entry &&
                    typeof entry.type === 'string' &&
                    'ok' in entry &&
                    entry.ok === false
                )
                .map((entry) => entry.type)
            : [];
        setTelegramMessage(
          `${sent}টি test message পাঠানো হয়েছে; ${failed}টি ব্যর্থ.` +
            (failures.length ? ` ব্যর্থ event: ${failures.join(', ')}` : '')
        );
        setTelegramMessageIsError(failed > 0 || !response.ok);
      }
    } catch (actionError) {
      setTelegramMessage(actionError instanceof Error ? actionError.message : 'Telegram পরীক্ষা ব্যর্থ হয়েছে।');
      setTelegramMessageIsError(true);
    } finally {
      setTelegramBusy(null);
    }
  };

  if (loading) {
    return <AdminLoading label="সেটিংস লোড হচ্ছে…" />;
  }

  if (!settings) {
    return (
      <>
        <PageHeader
          title="প্ল্যাটফর্ম সেটিংস"
          description="ব্যবসায়িক নিয়ম, সার্ভিস উপলব্ধতা ও নোটিফিকেশন কনফিগারেশন"
        />
        <AdminError
          title="সেটিংস লোড করা যায়নি"
          message={error || 'ডেটাবেজ থেকে সেটিংস পাওয়া যায়নি; কোনো পরিবর্তন সংরক্ষণ করা হবে না।'}
        />
      </>
    );
  }

  const serviceConfig = [
    { key: 'tolet', label: 'বাসা ভাড়া (To-Let)' },
    { key: 'home-tutor', label: 'গৃহশিক্ষক' },
    { key: 'home-moving', label: 'বাসা পাল্টানো' },
    { key: 'kajerBua', label: 'কাজের বুয়া' },
    { key: 'electrician', label: 'ইলেক্ট্রিশিয়ান' },
    { key: 'plumber', label: 'প্লাম্বার' },
  ] as const;

  const notificationConfig = [
    { key: 'notifyOnRequestSubmitted', label: 'নতুন রিকোয়েস্ট জমা', desc: 'গ্রাহক রিকোয়েস্ট জমা দিলে সতর্ক করুন' },
    { key: 'notifyOnStatusChange', label: 'স্ট্যাটাস পরিবর্তন', desc: 'রিকোয়েস্ট স্ট্যাটাস বদলে সতর্ক করুন' },
    { key: 'notifyAdminOnNewRequest', label: 'অ্যাডমিনকে নতুন রিকোয়েস্ট', desc: 'নতুন রিকোয়েস্টে অ্যাডমিনকে নোটিফাই করুন' },
    { key: 'notifyCustomerOnStatusChange', label: 'গ্রাহকে স্ট্যাটাস আপডেট', desc: 'স্ট্যাটাস বদলে গ্রাহককে নোটিফাই করুন' },
  ] as const;

  return (
    <div>
      <PageHeader
        title="প্ল্যাটফর্ম সেটিংস"
        description="ব্যবসায়িক নিয়ম, সার্ভিস উপলব্ধতা ও নোটিফিকেশন কনফিগারেশন"
      />

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" /> {success}
          </div>
        )}

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">অ্যাডমিন পাসওয়ার্ড পরিবর্তন</h2>
                <p className="text-xs text-slate-500">নতুন পাসওয়ার্ড সেট করতে আপনার অ্যাকাউন্ট যাচাই করুন।</p>
              </div>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              {hasPassword && (
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="বর্তমান পাসওয়ার্ড"
                  aria-label="বর্তমান পাসওয়ার্ড"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  placeholder="নতুন পাসওয়ার্ড"
                  aria-label="নতুন পাসওয়ার্ড"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  placeholder="নতুন পাসওয়ার্ড আবার লিখুন"
                  aria-label="নতুন পাসওয়ার্ড আবার লিখুন"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                />
              </div>
              {passwordError && (
                <p role="alert" className="text-sm text-red-700">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p role="status" className="text-sm text-emerald-700">{passwordSuccess}</p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {passwordSaving ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Telegram নোটিফিকেশন পরীক্ষা</h2>
                <p className="text-xs text-slate-500">Bot token, chat ID এবং সব ধরনের নমুনা alert যাচাই করুন।</p>
              </div>
            </div>
            {telegramMessage && (
              <p
                role={telegramMessageIsError ? 'alert' : 'status'}
                className={`mb-3 text-sm ${telegramMessageIsError ? 'text-red-700' : 'text-emerald-700'}`}
              >
                {telegramMessage}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={telegramBusy !== null}
                onClick={() => void runTelegramAction('health')}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {telegramBusy === 'health' ? 'যাচাই হচ্ছে…' : 'Bot ও chat যাচাই'}
              </button>
              <button
                type="button"
                disabled={telegramBusy !== null}
                onClick={() => void runTelegramAction('suite')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {telegramBusy === 'suite' && <Loader2 className="h-4 w-4 animate-spin" />}
                {telegramBusy === 'suite' ? 'নমুনা পাঠানো হচ্ছে…' : 'সব event-এর test পাঠান'}
              </button>
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
              {serviceConfig.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900 text-sm">{label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleService(key, !settings?.serviceAvailability[key])}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings?.serviceAvailability[key] ? 'bg-slate-700' : 'bg-slate-300'
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
    </div>
  );
}