import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { getAdminDataClient } from '@/lib/admin/queries';
import AdminConversation from './AdminConversation';

export const dynamic = 'force-dynamic';

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
  attachment_path: string | null;
  attachment_url?: string;
}

interface ReplyRow {
  id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  body: string;
  created_at: string;
}

export default async function AdminMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await getAdminDataClient();
  if (!admin) {
    return (
      <>
        <PageHeader title="সাপোর্ট কথোপকথন" />
        <AdminError title="অ্যাডমিন অনুমতি যাচাই করা যায়নি" />
      </>
    );
  }

  const { data: message, error } = await admin.client
    .from('contact_messages')
    .select('id, name, phone, email, subject, message, status, admin_notes, user_id, created_at, complaint_category, complaint_subject, attachment_path')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    return (
      <>
        <PageHeader title="সাপোর্ট কথোপকথন" />
        <AdminError title="কথোপকথন লোড করা যায়নি" message={error.message} />
      </>
    );
  }
  if (!message) {
    return (
      <>
        <PageHeader title="সাপোর্ট কথোপকথন" />
        <AdminEmpty title="বার্তাটি পাওয়া যায়নি" />
      </>
    );
  }

  const { data: replies, error: repliesError } = await admin.client
    .from('contact_message_replies')
    .select('id, sender_id, sender_role, body, created_at')
    .eq('message_id', id)
    .order('created_at', { ascending: true });
  if (repliesError) {
    return (
      <>
        <PageHeader title="সাপোর্ট কথোপকথন" />
        <AdminError title="কথোপকথনের উত্তর লোড করা যায়নি" message={repliesError.message} />
      </>
    );
  }

  let attachmentUrl: string | undefined;
  if (message.attachment_path) {
    const { data: attachment, error: attachmentError } = await admin.client.storage
      .from('support-attachments')
      .createSignedUrl(message.attachment_path, 3600);
    if (attachmentError) {
      return (
        <>
          <PageHeader title="সাপোর্ট কথোপকথন" />
          <AdminError title="অভিযোগের সংযুক্তি খোলা যায়নি" message={attachmentError.message} />
        </>
      );
    }
    attachmentUrl = attachment.signedUrl;
  }

  return (
    <>
      <PageHeader
        title="সাপোর্ট কথোপকথন"
        description={`${message.name} · ${message.phone} · ${message.complaint_subject || message.subject}`}
        breadcrumb={{ href: '/admin/messages', label: 'সব বার্তা' }}
      />
      <div className="mb-4">
        <Link href="/admin/messages" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-brand-700">
          <ArrowLeft className="h-4 w-4" /> বার্তা তালিকায় ফিরুন
        </Link>
      </div>
      <AdminConversation
        message={{ ...(message as MessageRow), attachment_url: attachmentUrl }}
        replies={(replies ?? []) as ReplyRow[]}
      />
    </>
  );
}
