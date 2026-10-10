'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { replyToCustomerMessage } from '@/app/admin/actions/messages';
import { useToast } from '@/components/admin/ToastProvider';

interface MessageRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  status: string;
  user_id: string | null;
  created_at: string;
}

interface ReplyRow {
  id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  body: string;
  created_at: string;
}

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
  const [busy, setBusy] = useState(false);

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
      <div className="rounded-xl border border-brand-100 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <strong className="text-xs text-ink-700">গ্রাহকের মূল বার্তা</strong>
          <time className="text-[10px] text-ink-400" dateTime={message.created_at}>
            {new Date(message.created_at).toLocaleString('bn-BD')}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-800">{message.message}</p>
        <p className="mt-3 text-[11px] text-ink-500">
          {message.user_id ? 'লগইন করা গ্রাহক — উত্তরটি তার ড্যাশবোর্ডে যাবে।' : 'অতিথি বার্তা — ব্যক্তিগত ইনবক্সে উত্তর পৌঁছাবে না। ফোনে যোগাযোগ করুন।'}
        </p>
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
    </section>
  );
}
