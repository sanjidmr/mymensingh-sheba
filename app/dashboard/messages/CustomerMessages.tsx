'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Mail, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface Reply {
  id: string;
  message_id: string;
  sender_role: 'customer' | 'admin';
  body: string;
  created_at: string;
}

const SUBJECTS = [
  { value: 'general', label: 'সাধারণ জিজ্ঞাসা' },
  { value: 'service_info', label: 'সেবা সম্পর্কে' },
  { value: 'post_service', label: 'পোস্ট ও অ্যাকাউন্ট' },
  { value: 'correction', label: 'তথ্য সংশোধন' },
  { value: 'complaint', label: 'অভিযোগ' },
  { value: 'other', label: 'অন্যান্য' },
];

const STATUS_LABEL: Record<string, string> = {
  new: 'নতুন',
  reviewing: 'পর্যালোচনাধীন',
  replied: 'উত্তর দেওয়া হয়েছে',
  closed: 'বন্ধ',
};

export default function CustomerMessages() {
  const { user } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!user) return { conversations: [] as Conversation[], replies: [] as Reply[] };
    if (!isSupabaseConfigured) {
      throw new Error('সাপোর্ট বার্তা ব্যবহারের জন্য ডেটাবেজ সংযুক্ত করতে হবে।');
    }
    const client = createClient();
    if (!client) {
      throw new Error('ডেটাবেজ সংযোগ তৈরি করা যায়নি।');
    }
    const { data, error: queryError } = await client.rpc('fn_my_contact_conversations');
    if (queryError) {
      throw new Error(`বার্তা লোড করা যায়নি: ${queryError.message}`);
    }
    const conversations = (data ?? []) as Conversation[];
    if (conversations.length) {
      const { data: replyData, error: replyError } = await client
        .from('contact_message_replies')
        .select('id, message_id, sender_role, body, created_at')
        .in('message_id', conversations.map((item) => item.id))
        .order('created_at', { ascending: true });
      if (replyError) throw new Error(`কথোপকথন লোড করা যায়নি: ${replyError.message}`);
      return { conversations, replies: (replyData ?? []) as Reply[] };
    }
    return { conversations, replies: [] as Reply[] };
  }, [user]);

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setItems(data.conversations);
      setReplies(data.replies);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'বার্তা লোড করা যায়নি।');
    }
    setLoading(false);
  }, [fetchConversations]);

  useEffect(() => {
    let active = true;
    void fetchConversations()
      .then((data) => {
        if (!active) return;
        setItems(data.conversations);
        setReplies(data.replies);
        setError('');
      })
      .catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : 'বার্তা লোড করা যায়নি।');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fetchConversations]);

  const submitNew = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const trimmed = message.trim();
    if (trimmed.length < 12) {
      setError('বার্তাটি কমপক্ষে ১২ অক্ষরের লিখুন।');
      return;
    }
    const client = createClient();
    if (!client) {
      setError('ডেটাবেজ সংযোগ তৈরি করা যায়নি।');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    const { error: insertError } = await client.from('contact_messages').insert({
      name: user.fullName,
      phone: user.phone,
      email: user.email || null,
      subject,
      message: trimmed,
      user_id: user.id,
    });
    if (insertError) setError(`বার্তা পাঠানো যায়নি: ${insertError.message}`);
    else {
      setMessage('');
      setSuccess('আপনার বার্তা সাপোর্ট টিমের কাছে পাঠানো হয়েছে।');
      await load();
    }
    setBusy(false);
  };

  const submitReply = async (event: FormEvent<HTMLFormElement>, conversationId: string) => {
    event.preventDefault();
    if (!user) return;
    const body = (replyDrafts[conversationId] ?? '').trim();
    if (!body || body.length > 1500) {
      setError('উত্তর ১ থেকে ১৫০০ অক্ষরের মধ্যে লিখুন।');
      return;
    }
    const client = createClient();
    if (!client) {
      setError('ডেটাবেজ সংযোগ তৈরি করা যায়নি।');
      return;
    }
    setBusy(true);
    setError('');
    const { error: insertError } = await client.from('contact_message_replies').insert({
      message_id: conversationId,
      sender_id: user.id,
      sender_role: 'customer',
      body,
    });
    if (insertError) setError(`উত্তর পাঠানো যায়নি: ${insertError.message}`);
    else {
      setReplyDrafts((previous) => ({ ...previous, [conversationId]: '' }));
      await load();
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-ink-900">সাপোর্ট বার্তা</h1>
        <p className="mt-1 text-[12.5px] text-ink-500">আপনার ব্যক্তিগত কথোপকথন শুধু আপনি ও সাপোর্ট টিম দেখতে পারবেন।</p>
      </header>

      <form onSubmit={submitNew} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink-900">
          <Mail className="h-4 w-4 text-brand-700" /> নতুন বার্তা
        </h2>
        <label className="grid gap-1 text-xs font-bold text-ink-700">
          বিষয়
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-11 rounded-xl border border-brand-100 px-3 text-sm">
            {SUBJECTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-ink-700">
          আপনার বার্তা
          <textarea required minLength={12} maxLength={1500} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="rounded-xl border border-brand-100 px-3 py-2.5 text-sm" />
        </label>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">{success}</p>}
        <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50">
          <Send className="h-4 w-4" />{busy ? 'পাঠানো হচ্ছে…' : 'সাপোর্টে পাঠান'}
        </button>
      </form>

      <section className="space-y-2" aria-labelledby="conversation-heading">
        <h2 id="conversation-heading" className="text-[13px] font-extrabold text-ink-900">কথোপকথনের ইতিহাস</h2>
        {loading ? (
          <div className="h-28 animate-pulse rounded-xl bg-mist-100" aria-label="বার্তা লোড হচ্ছে" />
        ) : error && items.length === 0 ? null : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-xs text-ink-500">এখনো কোনো কথোপকথন নেই।</div>
        ) : items.map((item) => {
          const threadReplies = replies.filter((reply) => reply.message_id === item.id);
          const isOpen = expanded === item.id;
          return (
            <article key={item.id} className="overflow-hidden rounded-xl border border-brand-100 bg-white">
              <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)} aria-expanded={isOpen} className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-mist-50">
                <MessageCircle className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-ink-900">{SUBJECTS.find((option) => option.value === item.subject)?.label ?? item.subject}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-500">{item.message}</span>
                </span>
                <span className="shrink-0 rounded-full bg-mist-50 px-2 py-1 text-[10px] font-bold text-brand-800">{STATUS_LABEL[item.status] ?? item.status}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-brand-100 p-3">
                  <MessageBubble sender="আপনি" body={item.message} time={item.created_at} />
                  {threadReplies.map((reply) => (
                    <MessageBubble key={reply.id} sender={reply.sender_role === 'admin' ? 'সাপোর্ট টিম' : 'আপনি'} body={reply.body} time={reply.created_at} />
                  ))}
                  {item.status !== 'closed' && (
                    <form onSubmit={(event) => void submitReply(event, item.id)} className="flex items-end gap-2">
                      <label className="sr-only" htmlFor={`reply-${item.id}`}>উত্তর লিখুন</label>
                      <textarea id={`reply-${item.id}`} rows={2} maxLength={1500} value={replyDrafts[item.id] ?? ''} onChange={(event) => setReplyDrafts((previous) => ({ ...previous, [item.id]: event.target.value }))} className="min-h-11 flex-1 resize-y rounded-lg border border-brand-100 px-3 py-2 text-sm" placeholder="উত্তর লিখুন…" />
                      <button type="submit" disabled={busy || !(replyDrafts[item.id] ?? '').trim()} aria-label="উত্তর পাঠান" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
                    </form>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function MessageBubble({ sender, body, time }: { sender: string; body: string; time: string }) {
  return (
    <div className="rounded-lg bg-mist-50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[11px] text-ink-700">{sender}</strong>
        <time className="text-[10px] text-ink-400" dateTime={time}>{new Date(time).toLocaleString('bn-BD')}</time>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}
