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
    .select('id, name, phone, email, subject, message, status, user_id, created_at')
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

  return (
    <>
      <PageHeader
        title="সাপোর্ট কথোপকথন"
        description={`${message.name} · ${message.phone} · ${message.subject}`}
        breadcrumb={{ href: '/admin/messages', label: 'সব বার্তা' }}
      />
      <div className="mb-4">
        <Link href="/admin/messages" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-brand-700">
          <ArrowLeft className="h-4 w-4" /> বার্তা তালিকায় ফিরুন
        </Link>
      </div>
      <AdminConversation
        message={message as MessageRow}
        replies={(replies ?? []) as ReplyRow[]}
      />
    </>
  );
}
