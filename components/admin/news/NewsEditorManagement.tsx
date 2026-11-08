'use client';

import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Mail, RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { StatCard } from '@/components/admin/StatCard';
import { useToast } from '@/components/admin/ToastProvider';
import {
  createNewsEditor,
  fetchNewsEditors,
  sendNewsEditorPasswordSetup,
  setNewsEditorActive,
  setNewsEditorPublishPermission,
  type NewsEditorSummary,
} from '@/app/admin/actions/news-editors';
import { formatDateTime } from '@/lib/admin/format';

export default function NewsEditorManagement() {
  const { notify } = useToast();
  const [editors, setEditors] = useState<NewsEditorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [canPublish, setCanPublish] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<NewsEditorSummary | null>(null);

  const applyEditorList = useCallback((result: Awaited<ReturnType<typeof fetchNewsEditors>>) => {
    if (result.ok) {
      setEditors(result.data ?? []);
      setLoadError('');
    } else {
      setLoadError(result.error);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      applyEditorList(await fetchNewsEditors());
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'এডিটর তালিকা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [applyEditorList]);

  useEffect(() => {
    let active = true;
    fetchNewsEditors()
      .then((result) => {
        if (active) applyEditorList(result);
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(cause instanceof Error ? cause.message : 'এডিটর তালিকা লোড করা যায়নি।');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyEditorList]);

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormBusy(true);
    const result = await createNewsEditor({ fullName, email, canPublish });
    if (!result.ok) {
      notify('error', 'এডিটর তৈরি হয়নি', result.error);
    } else {
      notify('success', 'নিরাপদ আমন্ত্রণ পাঠানো হয়েছে', result.message);
      setFullName('');
      setEmail('');
      setCanPublish(false);
      await refresh();
    }
    setFormBusy(false);
  };

  const changeActive = async () => {
    if (!pendingStatus) return;
    const editor = pendingStatus;
    setBusyId(editor.id);
    const result = await setNewsEditorActive(editor.id, !editor.active);
    if (!result.ok) notify('error', 'অ্যাকাউন্ট পরিবর্তন হয়নি', result.error);
    else {
      notify('success', 'অ্যাকাউন্টের অবস্থা বদলেছে', result.message);
      setPendingStatus(null);
      await refresh();
    }
    setBusyId('');
  };

  const changePublishPermission = async (editor: NewsEditorSummary) => {
    setBusyId(editor.id);
    const result = await setNewsEditorPublishPermission(editor.id, !editor.canPublish);
    if (!result.ok) notify('error', 'অনুমতি বদলানো যায়নি', result.error);
    else {
      notify('success', 'প্রকাশনার অনুমতি বদলেছে', result.message);
      await refresh();
    }
    setBusyId('');
  };

  const sendPasswordLink = async (editor: NewsEditorSummary) => {
    setBusyId(editor.id);
    const result = await sendNewsEditorPasswordSetup(editor.id);
    if (!result.ok) notify('error', 'ইমেইল পাঠানো যায়নি', result.error);
    else notify('success', 'পাসওয়ার্ড সেটআপ ইমেইল পাঠানো হয়েছে', result.message);
    setBusyId('');
  };

  const activeCount = editors.filter((editor) => editor.active).length;
  const articleCount = editors.reduce((total, editor) => total + editor.totalArticles, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="মোট এডিটর" value={editors.length} icon={Users} />
        <StatCard label="সক্রিয় এডিটর" value={activeCount} tone="good" icon={ShieldCheck} />
        <StatCard label="এডিটরের সংবাদ" value={articleCount} />
      </div>

      <form onSubmit={submitCreate} className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-navy text-white">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-admin-text">নতুন নিউজ এডিটর আমন্ত্রণ</h2>
            <p className="mt-1 text-xs leading-relaxed text-admin-muted">
              Supabase Auth থেকে পাসওয়ার্ড সেটআপের নিরাপদ ইমেইল যাবে। পাসওয়ার্ড এই ফর্মে নেওয়া বা সংরক্ষণ করা হয় না।
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-admin-text">
            পূর্ণ নাম
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              minLength={3}
              maxLength={120}
              autoComplete="name"
              className="h-11 w-full rounded-md border border-admin-border px-3 text-sm font-normal"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-admin-text">
            ইমেইল
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={254}
              autoComplete="email"
              className="h-11 w-full rounded-md border border-admin-border px-3 text-sm font-normal"
            />
          </label>
        </div>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-admin-text">
          <input
            type="checkbox"
            checked={canPublish}
            onChange={(event) => setCanPublish(event.target.checked)}
            className="h-4 w-4 accent-admin-navy"
          />
          সরাসরি প্রকাশের অনুমতি দিন
        </label>
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={formBusy} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90 disabled:opacity-60">
            {formBusy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            {formBusy ? 'আমন্ত্রণ পাঠানো হচ্ছে…' : 'আমন্ত্রণ পাঠান'}
          </button>
        </div>
      </form>

      <section className="rounded-admin-card border border-admin-border bg-white shadow-admin-card">
        <div className="flex items-center justify-between gap-3 border-b border-admin-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-admin-text">এডিটর অ্যাকাউন্ট ও কার্যক্রম</h2>
            <p className="mt-0.5 text-xs text-admin-muted">প্রকাশিত সংবাদ, খসড়া, অনুমোদনের অপেক্ষা এবং সাম্প্রতিক সম্পাদনা।</p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading} aria-label="তালিকা হালনাগাদ" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-admin-border text-admin-muted hover:bg-admin-page disabled:opacity-60">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>

        {loadError ? (
          <div className="p-4"><AdminError title="এডিটর তথ্য লোড হয়নি" message={loadError} /></div>
        ) : loading ? (
          <p role="status" className="flex min-h-28 items-center justify-center gap-2 text-sm text-admin-muted">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> এডিটর তথ্য লোড হচ্ছে…
          </p>
        ) : editors.length === 0 ? (
          <div className="p-4"><AdminEmpty title="এখনো কোনো নিউজ এডিটর নেই" description="উপরের ফর্ম থেকে একজন এডিটরকে নিরাপদ আমন্ত্রণ পাঠান।" /></div>
        ) : (
          <ul className="divide-y divide-admin-border">
            {editors.map((editor) => (
              <li key={editor.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-bold text-admin-text">{editor.fullName}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${editor.active ? 'bg-status-approved-bg text-status-success' : 'bg-status-disabled-bg text-status-disabled'}`}>
                        {editor.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${editor.canPublish ? 'bg-admin-navy text-white' : 'bg-status-pending-bg text-status-pending'}`}>
                        {editor.canPublish ? 'সরাসরি প্রকাশ' : 'অ্যাডমিন অনুমোদন'}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-xs text-admin-muted">{editor.email || 'ইমেইল পাওয়া যায়নি'}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <span className="rounded-md bg-admin-page px-2.5 py-2">মোট: <strong>{editor.totalArticles}</strong></span>
                      <span className="rounded-md bg-admin-page px-2.5 py-2">প্রকাশিত: <strong>{editor.publishedArticles}</strong></span>
                      <span className="rounded-md bg-admin-page px-2.5 py-2">খসড়া: <strong>{editor.drafts}</strong></span>
                      <span className="rounded-md bg-admin-page px-2.5 py-2">অপেক্ষমাণ: <strong>{editor.pending}</strong></span>
                    </div>
                    <p className="mt-2 text-[11px] text-admin-muted">
                      সাম্প্রতিক কার্যক্রম: {editor.lastActivity ? formatDateTime(editor.lastActivity) : 'এখনো কোনো সংবাদ সম্পাদনা করেননি'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:max-w-[410px] xl:justify-end">
                    <button
                      type="button"
                      onClick={() => void changePublishPermission(editor)}
                      disabled={busyId === editor.id}
                      className="min-h-9 rounded-md border border-admin-border px-3 text-xs font-semibold text-admin-text hover:bg-admin-page disabled:opacity-50"
                    >
                      {editor.canPublish ? 'প্রকাশ অনুমতি বন্ধ' : 'প্রকাশ অনুমতি দিন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendPasswordLink(editor)}
                      disabled={busyId === editor.id || !editor.email}
                      className="min-h-9 rounded-md border border-admin-border px-3 text-xs font-semibold text-admin-text hover:bg-admin-page disabled:opacity-50"
                    >
                      পাসওয়ার্ড লিংক পাঠান
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingStatus(editor)}
                      disabled={busyId === editor.id}
                      className={`min-h-9 rounded-md px-3 text-xs font-semibold disabled:opacity-50 ${editor.active ? 'border border-rose-200 text-rose-700 hover:bg-rose-50' : 'bg-admin-navy text-white hover:bg-admin-navy/90'}`}
                    >
                      {editor.active ? 'অ্যাকাউন্ট বন্ধ' : 'আবার সক্রিয়'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus?.active ? 'এডিটরের প্রবেশাধিকার বন্ধ করবেন?' : 'এডিটর অ্যাকাউন্ট সক্রিয় করবেন?'}
        description={pendingStatus?.active
          ? 'এডিটর সঙ্গে সঙ্গে নিউজ ড্যাশবোর্ড, নিবন্ধ ও সংবাদ-অ্যানালিটিক্স ব্যবহার করতে পারবেন না। বিদ্যমান সংবাদ মুছে যাবে না।'
          : 'এডিটর আবার নিউজ ড্যাশবোর্ডে প্রবেশ করতে পারবেন; প্রকাশের অনুমতি আলাদা সেটিং।'}
        confirmLabel={pendingStatus?.active ? 'প্রবেশাধিকার বন্ধ করুন' : 'সক্রিয় করুন'}
        isLoading={Boolean(pendingStatus && busyId === pendingStatus.id)}
        onConfirm={() => void changeActive()}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
