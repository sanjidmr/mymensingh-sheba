'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Mail, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { requestAdminEmailAlert } from '@/lib/admin-email-alerts';

export type SupportMode = 'messages' | 'complaints';

interface Conversation {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  complaint_category: string | null;
  complaint_subject: string | null;
  attachment_path: string | null;
  attachment_url?: string;
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
  { value: 'other', label: 'অন্যান্য' },
];

const COMPLAINT_CATEGORIES = [
  { value: 'account', label: 'অ্যাকাউন্ট ও নিরাপত্তা' },
  { value: 'posts', label: 'পোস্ট বা বিজ্ঞাপন' },
  { value: 'service', label: 'সেবা বা রিকোয়েস্ট' },
  { value: 'safety', label: 'নিরাপত্তা ও আচরণ' },
  { value: 'payment', label: 'পেমেন্ট বা চার্জ' },
  { value: 'other', label: 'অন্যান্য' },
];

const ATTACHMENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'নতুন',
  reviewing: 'পর্যালোচনাধীন',
  replied: 'উত্তর দেওয়া হয়েছে',
  closed: 'বন্ধ',
};

/**
 * Customer support surface.
 *
 * Backed by the existing `contact_messages` / `contact_message_replies` tables
 * and the `fn_my_contact_conversations` RPC — the same data the admin inbox
 * already manages. `mode` decides whether the page is the plain message thread
 * with the support team (`messages`) or the dedicated complaint tracker
 * (`complaints`); both write to the same table using `subject = 'complaint'`
 * to tell a complaint apart from a normal message.
 */
export default function SupportCenter({ mode }: { mode: SupportMode }) {
  const { user } = useAuth();
  const isComplaints = mode === 'complaints';

  const [items, setItems] = useState<Conversation[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('posts');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!user) return { conversations: [] as Conversation[], replies: [] as Reply[] };
    if (!isSupabaseConfigured) {
      throw new Error('সাপোর্ট ব্যবহারের জন্য ডেটাবেজ সংযুক্ত করতে হবে।');
    }
    const client = createClient();
    if (!client) {
      throw new Error('ডেটাবেজ সংযোগ তৈরি করা যায়নি।');
    }
    const { data, error: queryError } = await client.rpc('fn_my_contact_conversations');
    if (queryError) {
      throw new Error(`লোড করা যায়নি: ${queryError.message}`);
    }
    const conversations = (data ?? []) as Conversation[];
    if (conversations.length) {
      const { data: replyData, error: replyError } = await client
        .from('contact_message_replies')
        .select('id, message_id, sender_role, body, created_at')
        .in('message_id', conversations.map((item) => item.id))
        .order('created_at', { ascending: true });
      if (replyError) throw new Error(`কথোপকথন লোড করা যায়নি: ${replyError.message}`);
      const withAttachments = await Promise.all(conversations.map(async (item) => {
        if (!item.attachment_path) return item;
        const { data: signed, error: signedError } = await client.storage
          .from('support-attachments')
          .createSignedUrl(item.attachment_path, 3600);
        if (signedError) throw new Error(`সংযুক্তি খোলা যায়নি: ${signedError.message}`);
        return { ...item, attachment_url: signed.signedUrl };
      }));
      return { conversations: withAttachments, replies: (replyData ?? []) as Reply[] };
    }
    return { conversations, replies: [] as Reply[] };
  }, [user]);

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setItems(data.conversations);
      setReplies(data.replies);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'লোড করা যায়নি।');
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
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'লোড করা যায়নি।');
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

  const submitComplaint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const title = complaintSubject.trim();
    const details = complaintDetails.trim();
    if (title.length < 3 || title.length > 120) {
      setError('অভিযোগের বিষয় ৩ থেকে ১২০ অক্ষরের মধ্যে লিখুন।');
      return;
    }
    if (details.length < 12 || details.length > 1500) {
      setError('বিস্তারিত ১২ থেকে ১৫০০ অক্ষরের মধ্যে লিখুন।');
      return;
    }
    if (attachment && (!ATTACHMENT_TYPES[attachment.type] || attachment.size > 5 * 1024 * 1024)) {
      setError('সংযুক্তি JPG, PNG, WEBP বা PDF হতে হবে এবং সর্বোচ্চ ৫ MB হতে পারবে।');
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
    let attachmentPath: string | null = null;
    try {
      if (attachment) {
        const extension = ATTACHMENT_TYPES[attachment.type];
        attachmentPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage
          .from('support-attachments')
          .upload(attachmentPath, attachment, { contentType: attachment.type, upsert: false });
        if (uploadError) throw new Error(`সংযুক্তি আপলোড করা যায়নি: ${uploadError.message}`);
      }

      const messageId = crypto.randomUUID();
      const { error: insertError } = await client.from('contact_messages').insert({
        id: messageId,
        name: user.fullName,
        phone: user.phone,
        email: user.email || null,
        subject: 'complaint',
        complaint_category: complaintCategory,
        complaint_subject: title,
        attachment_path: attachmentPath,
        message: details,
        user_id: user.id,
      });
      if (insertError) {
        let cleanupNote = '';
        if (attachmentPath) {
          const { error: cleanupError } = await client.storage
            .from('support-attachments')
            .remove([attachmentPath]);
          if (cleanupError) cleanupNote = ` সংযুক্তি পরিষ্কার করা যায়নি: ${cleanupError.message}`;
        }
        throw new Error(`অভিযোগ জমা দেওয়া যায়নি: ${insertError.message}.${cleanupNote}`);
      }
      if (['safety', 'payment'].includes(complaintCategory)) {
        void requestAdminEmailAlert('contact_message', messageId);
      }

      setComplaintSubject('');
      setComplaintDetails('');
      setAttachment(null);
      setSuccess('আপনার অভিযোগ জমা হয়েছে। এই পাতায় এর স্ট্যাটাস ও সাপোর্ট টিমের উত্তর দেখতে পারবেন।');
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'অভিযোগ জমা দেওয়া যায়নি।');
    } finally {
      setBusy(false);
    }
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

  const visible = items.filter((item) =>
    isComplaints ? item.subject === 'complaint' : item.subject !== 'complaint'
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-ink-900">{isComplaints ? 'অভিযোগ কেন্দ্র' : 'বার্তা'}</h1>
        <p className="mt-1 text-[12.5px] text-ink-500">
          {isComplaints
            ? 'সমস্যা জানান এবং সাপোর্ট টিমের সাড়া ও অগ্রগতি এক জায়গায় দেখুন।'
            : 'সাপোর্ট টিমের সাথে আপনার ব্যক্তিগত কথোপকথন দেখুন ও নতুন বার্তা পাঠান।'}
        </p>
      </header>

      {isComplaints ? (
        <form id="complaint-form" onSubmit={submitComplaint} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink-900">
            <MessageCircle className="h-4 w-4 text-amber-800" /> অভিযোগ জানান
          </h2>
          <p className="text-xs leading-relaxed text-ink-600">অভিযোগটি সঠিক টিমে পাঠাতে বিভাগ বাছুন। প্রয়োজন হলে ছবি বা PDF যুক্ত করুন।</p>
          <label className="grid gap-1 text-xs font-bold text-ink-700">
            অভিযোগের বিভাগ
            <select value={complaintCategory} onChange={(event) => setComplaintCategory(event.target.value)} className="min-h-11 rounded-xl border border-amber-200 bg-white px-3 text-sm">
              {COMPLAINT_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink-700">
            বিষয়
            <input required minLength={3} maxLength={120} value={complaintSubject} onChange={(event) => setComplaintSubject(event.target.value)} className="min-h-11 rounded-xl border border-amber-200 bg-white px-3 text-sm" placeholder="সংক্ষেপে সমস্যাটি লিখুন" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink-700">
            বিস্তারিত
            <textarea required minLength={12} maxLength={1500} rows={4} value={complaintDetails} onChange={(event) => setComplaintDetails(event.target.value)} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm" placeholder="কী ঘটেছে এবং কীভাবে সাহায্য করতে পারি তা লিখুন" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink-700">
            সংযুক্তি <span className="font-normal text-ink-500">(ঐচ্ছিক · JPG, PNG, WEBP বা PDF · সর্বোচ্চ ৫ MB)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} className="min-h-11 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-2 file:py-1 file:text-xs file:font-bold" />
          </label>
          {attachment && <p className="text-xs text-ink-500">{attachment.name} · {(attachment.size / 1024 / 1024).toFixed(1)} MB</p>}
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">{error}</p>}
          {success && <p role="status" className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">{success}</p>}
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-800 px-4 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-50">
            <Send className="h-4 w-4" />{busy ? 'জমা হচ্ছে…' : 'অভিযোগ জমা দিন'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitNew} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink-900">
            <Mail className="h-4 w-4 text-brand-700" /> অ্যাডমিনকে মেসেজ দিন
          </h2>
          <p className="text-xs leading-relaxed text-ink-500">আপনার ব্যক্তিগত কথোপকথন শুধু আপনি ও সাপোর্ট টিম দেখতে পারবেন।</p>
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
      )}

      <section className="space-y-2" aria-labelledby="conversation-heading">
        <h2 id="conversation-heading" className="text-[13px] font-extrabold text-ink-900">
          {isComplaints ? 'অভিযোগের ইতিহাস' : 'কথোপকথনের ইতিহাস'}
        </h2>
        {loading ? (
          <div className="h-28 animate-pulse rounded-xl bg-mist-100" aria-label="লোড হচ্ছে" />
        ) : error && visible.length === 0 ? null : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-xs text-ink-500">
            {isComplaints ? 'এখনো কোনো অভিযোগ জমা দেওয়া হয়নি।' : 'এখনো কোনো কথোপকথন নেই।'}
          </div>
        ) : visible.map((item) => {
          const threadReplies = replies.filter((reply) => reply.message_id === item.id);
          const isOpen = expanded === item.id;
          return (
            <article key={item.id} className="overflow-hidden rounded-xl border border-brand-100 bg-white">
              <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)} aria-expanded={isOpen} className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-mist-50">
                <MessageCircle className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-ink-900">
                    {item.subject === 'complaint'
                      ? `${item.complaint_subject || 'অভিযোগ'} · ${COMPLAINT_CATEGORIES.find((option) => option.value === item.complaint_category)?.label ?? 'অভিযোগ'}`
                      : SUBJECTS.find((option) => option.value === item.subject)?.label ?? item.subject}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-500">{item.message}</span>
                </span>
                <span className="shrink-0 rounded-full bg-mist-50 px-2 py-1 text-[10px] font-bold text-brand-800">{STATUS_LABEL[item.status] ?? item.status}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-brand-100 p-3">
                  <MessageBubble sender="আপনি" body={item.message} time={item.created_at} />
                  {item.attachment_url && (
                    <a href={item.attachment_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-brand-200 bg-white px-3 text-xs font-bold text-brand-800 hover:bg-brand-50">
                      সংযুক্তি দেখুন
                    </a>
                  )}
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
