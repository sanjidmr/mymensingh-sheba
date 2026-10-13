'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { replyToCustomerMessage } from '@/app/admin/actions/messages';
import { saveMessageNote, setMessageStatus } from '@/app/admin/actions/messages';
import { useToast } from '@/components/admin/ToastProvider';

interface MessageRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  status: string;
  admin_notes: string | null;
  user_id: string | null;
  created_at: string;
  complaint_category: string | null;
  complaint_subject: string | null;
  attachment_url?: string;
}

interface ReplyRow {
  id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  body: string;
  created_at: string;
}

const COMPLAINT_CATEGORY_LABEL: Record<string, string> = {
  account: 'অ্যাকাউন্ট ও নিরাপত্তা',
  posts: 'পোস্ট বা বিজ্ঞাপন',
  service: 'সেবা বা রিকোয়েস্ট',
  safety: 'নিরাপত্তা ও আচরণ',
  payment: 'পেমেন্ট বা চার্জ',
  other: 'অন্যান্য',
};

export default function AdminConversation({
  message,
  replies,
}: {
  message: MessageRow;
  replies: ReplyRow[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [body, setBody] = useState('');
  const [note, setNote] = useState(message.admin_notes ?? '');
  const [busy, setBusy] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const updateStatus = async (status: 'new' | 'reviewing' | 'replied' | 'closed') => {
    setSavingStatus(true);
    try {
      const result = await setMessageStatus(message.id, status);
      if (!result.ok) {
        notify('error', 'স্ট্যাটাস পরিবর্তন হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'স্ট্যাটাস সংরক্ষিত হয়েছে।');
      router.refresh();
    } catch (error) {
      notify('error', 'স্ট্যাটাস পরিবর্তন হয়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const result = await saveMessageNote(message.id, note);
      if (!result.ok) {
        notify('error', 'অভ্যন্তরীণ নোট সংরক্ষিত হয়নি', result.error);
        return;
      }
      notify('success', 'অভ্যন্তরীণ নোট সংরক্ষিত হয়েছে।');
      router.refresh();
    } catch (error) {
      notify('error', 'অভ্যন্তরীণ নোট সংরক্ষিত হয়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setSavingNote(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await replyToCustomerMessage(message.id, body);
      if (!result.ok) {
        notify('error', 'উত্তর পাঠানো যায়নি', result.error);
        return;
      }
      setBody('');
      notify('success', result.message ?? 'উত্তর পাঠানো হয়েছে।');
      router.refresh();
    } catch (error) {
      notify('error', 'উত্তর পাঠানো যায়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-3xl space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="support-status" className="mb-1 block text-xs font-bold text-ink-700">টিকিট স্ট্যাটাস</label>
          <select
            id="support-status"
            value={message.status}
            disabled={savingStatus}
            onChange={(event) => void updateStatus(event.target.value as 'new' | 'reviewing' | 'replied' | 'closed')}
            className="min-h-11 w-full rounded-lg border border-brand-100 bg-white px-3 text-sm sm:w-56"
          >
            <option value="new">নতুন</option>
            <option value="reviewing">পর্যালোচনাধীন</option>
            <option value="replied">উত্তর দেওয়া হয়েছে</option>
            <option value="closed">বন্ধ</option>
          </select>
        </div>
        <p className="text-xs text-ink-500">টিকিট ID: <span className="break-all font-mono">{message.id}</span></p>
      </div>
      <div className="rounded-xl border border-brand-100 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <strong className="text-xs text-ink-700">
            {message.subject === 'complaint'
              ? `অভিযোগ · ${message.complaint_subject || 'বিষয় উল্লেখ নেই'}`
              : 'গ্রাহকের মূল বার্তা'}
          </strong>
          <time className="text-[10px] text-ink-400" dateTime={message.created_at}>
            {new Date(message.created_at).toLocaleString('bn-BD')}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-800">{message.message}</p>
        <p className="mt-3 text-[11px] text-ink-500">
          {message.user_id ? 'লগইন করা গ্রাহক — উত্তরটি তার ড্যাশবোর্ডে যাবে।' : 'অতিথি বার্তা — ব্যক্তিগত ইনবক্সে উত্তর পৌঁছাবে না। ফোনে যোগাযোগ করুন।'}
        </p>
        {message.complaint_category && (
          <p className="mt-2 text-xs text-ink-500">বিভাগ: {COMPLAINT_CATEGORY_LABEL[message.complaint_category] ?? message.complaint_category}</p>
        )}
        {message.attachment_url && (
          <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-brand-200 px-3 text-xs font-bold text-brand-800 hover:bg-brand-50">
            সংযুক্তি দেখুন
          </a>
        )}
      </div>

      {replies.map((reply) => (
        <div key={reply.id} className={`rounded-xl border p-4 ${reply.sender_role === 'admin' ? 'border-emerald-200 bg-emerald-50' : 'border-brand-100 bg-white'}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <strong className="text-xs text-ink-700">{reply.sender_role === 'admin' ? 'সাপোর্ট টিম' : message.name}</strong>
            <time className="text-[10px] text-ink-400" dateTime={reply.created_at}>{new Date(reply.created_at).toLocaleString('bn-BD')}</time>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-800">{reply.body}</p>
        </div>
      ))}

      {message.user_id ? (
        <form onSubmit={submit} className="space-y-2 rounded-xl border border-brand-100 bg-white p-4">
          <label htmlFor="admin-reply" className="block text-xs font-bold text-ink-700">গ্রাহককে ব্যক্তিগত উত্তর</label>
          <textarea id="admin-reply" required minLength={1} maxLength={1500} rows={4} value={body} onChange={(event) => setBody(event.target.value)} className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm" />
          <button type="submit" disabled={busy || !body.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white disabled:opacity-50">
            <Send className="h-4 w-4" />{busy ? 'পাঠানো হচ্ছে…' : 'উত্তর পাঠান'}
          </button>
        </form>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">এই বার্তাটি লগইন করা গ্রাহক অ্যাকাউন্টের সাথে যুক্ত নয়; ফোন বা ইমেইল ব্যবহার করে যোগাযোগ করুন।</p>
      )}

      <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <div>
          <label htmlFor="internal-note" className="block text-xs font-bold text-amber-950">অভ্যন্তরীণ নোট — শুধু অ্যাডমিনদের জন্য</label>
          <p className="mt-1 text-xs text-amber-900">এই নোট গ্রাহকের কথোপকথন বা নোটিফিকেশনে প্রকাশ হবে না।</p>
        </div>
        <textarea
          id="internal-note"
          maxLength={1000}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
        />
        <button type="button" disabled={savingNote} onClick={() => void saveNote()} className="min-h-10 rounded-lg border border-amber-300 px-4 text-xs font-bold text-amber-950 disabled:opacity-50">
          {savingNote ? 'সংরক্ষণ হচ্ছে…' : 'অভ্যন্তরীণ নোট সংরক্ষণ'}
        </button>
      </section>
    </section>
  );
}
