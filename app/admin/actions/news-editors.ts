'use server';

import { revalidatePath } from 'next/cache';
import {
  createAuthAdminClient,
  createRecoveryMailClient,
  getVerifiedNewsAdmin,
  newsEditorRedirectUrl,
} from '@/lib/news/news-authorization.server';

export type NewsEditorSummary = {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  canPublish: boolean;
  totalArticles: number;
  publishedArticles: number;
  drafts: number;
  pending: number;
  lastActivity: string | null;
};

export type NewsEditorActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; error: string };

async function rollbackInvitedUser(
  authAdmin: NonNullable<ReturnType<typeof createAuthAdminClient>>,
  editorId: string
): Promise<string | null> {
  try {
    const { error } = await authAdmin.auth.admin.deleteUser(editorId);
    if (!error) return null;
    console.error('[news-editors] invite rollback failed:', error);
    return error.message;
  } catch (error) {
    console.error('[news-editors] invite rollback failed:', error);
    return error instanceof Error ? error.message : 'অজানা ত্রুটি';
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchNewsEditors(): Promise<NewsEditorActionResult<NewsEditorSummary[]>> {
  const admin = await getVerifiedNewsAdmin();
  if (!admin) return { ok: false, error: 'শুধু প্রধান অ্যাডমিন এই তথ্য দেখতে পারবেন।' };

  const { data: profiles, error: profileError } = await admin.client
    .from('profiles')
    .select('id, full_name, email, status')
    .eq('role', 'news_editor')
    .order('created_at', { ascending: false });
  if (profileError) return { ok: false, error: `এডিটর তালিকা লোড হয়নি: ${profileError.message}` };

  const editorIds = (profiles ?? []).map((profile) => profile.id);
  if (editorIds.length === 0) return { ok: true, message: 'এখনো কোনো নিউজ এডিটর নেই।', data: [] };

  const [settingsResult, postsResult] = await Promise.all([
    admin.client
      .from('news_editor_settings')
      .select('editor_id, can_publish')
      .in('editor_id', editorIds),
    admin.client
      .from('community_posts')
      .select('author_id, status, updated_at')
      .eq('kind', 'news')
      .in('author_id', editorIds),
  ]);
  if (settingsResult.error) {
    return { ok: false, error: `এডিটর অনুমতি লোড হয়নি: ${settingsResult.error.message}` };
  }
  if (postsResult.error) {
    return { ok: false, error: `এডিটরের সংবাদ-তথ্য লোড হয়নি: ${postsResult.error.message}` };
  }

  const settings = new Map((settingsResult.data ?? []).map((item) => [item.editor_id, item.can_publish]));
  const counts = new Map<string, Omit<NewsEditorSummary, 'id' | 'fullName' | 'email' | 'active' | 'canPublish'>>();
  for (const post of postsResult.data ?? []) {
    const item = counts.get(post.author_id) ?? {
      totalArticles: 0,
      publishedArticles: 0,
      drafts: 0,
      pending: 0,
      lastActivity: null,
    };
    item.totalArticles += 1;
    if (post.status === 'approved') item.publishedArticles += 1;
    if (post.status === 'draft') item.drafts += 1;
    if (post.status === 'pending') item.pending += 1;
    if (!item.lastActivity || post.updated_at > item.lastActivity) item.lastActivity = post.updated_at;
    counts.set(post.author_id, item);
  }

  return {
    ok: true,
    message: 'এডিটর তালিকা লোড হয়েছে।',
    data: (profiles ?? []).map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email ?? '',
      active: profile.status === 'active',
      canPublish: settings.get(profile.id) === true,
      ...(counts.get(profile.id) ?? {
        totalArticles: 0,
        publishedArticles: 0,
        drafts: 0,
        pending: 0,
        lastActivity: null,
      }),
    })),
  };
}

export async function createNewsEditor(input: {
  fullName: string;
  email: string;
  canPublish: boolean;
}): Promise<NewsEditorActionResult> {
  const admin = await getVerifiedNewsAdmin();
  if (!admin) return { ok: false, error: 'শুধু প্রধান অ্যাডমিন নিউজ এডিটর তৈরি করতে পারবেন।' };
  if (!input || typeof input !== 'object') return { ok: false, error: 'এডিটরের তথ্য সঠিক নয়।' };

  const fullName = typeof input?.fullName === 'string' ? input.fullName.trim() : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (fullName.length < 3 || fullName.length > 120) {
    return { ok: false, error: 'নাম ৩ থেকে ১২০ অক্ষরের মধ্যে লিখুন।' };
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: 'সঠিক ইমেইল ঠিকানা লিখুন।' };
  }
  if (typeof input.canPublish !== 'boolean') {
    return { ok: false, error: 'প্রকাশনার অনুমতি নির্বাচন সঠিক নয়।' };
  }

  const authAdmin = createAuthAdminClient();
  if (!authAdmin) return { ok: false, error: 'সার্ভারের নিরাপদ Auth সংযোগ কনফিগার করা নেই।' };

  try {
    const { data, error } = await authAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: newsEditorRedirectUrl(),
    });
    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message.includes('already') || error?.message.includes('registered')
          ? 'এই ইমেইলে আগে থেকেই একটি অ্যাকাউন্ট আছে। বিদ্যমান এডিটর তালিকা যাচাই করুন।'
          : `নিরাপদ আমন্ত্রণ পাঠানো যায়নি: ${error?.message ?? 'Auth ব্যবহারকারী তৈরি হয়নি।'}`,
      };
    }

    const editorId = data.user.id;
    const { data: profile, error: profileError } = await admin.client
      .from('profiles')
      .update({ full_name: fullName, email, role: 'news_editor', status: 'active' })
      .eq('id', editorId)
      .select('id')
      .maybeSingle();

    if (profileError || !profile) {
      const rollbackError = await rollbackInvitedUser(authAdmin, editorId);
      return {
        ok: false,
        error: `এডিটর ভূমিকা নিরাপদে সংরক্ষণ হয়নি${profileError ? `: ${profileError.message}` : '।'}${rollbackError ? ` Auth ব্যবহারকারী মুছে ফেলা যায়নি: ${rollbackError}` : ''}`,
      };
    }

    const { error: settingsError } = await admin.client
      .from('news_editor_settings')
      .upsert(
        { editor_id: editorId, can_publish: input.canPublish, created_by: admin.userId },
        { onConflict: 'editor_id' }
      );
    if (settingsError) {
      const rollbackError = await rollbackInvitedUser(authAdmin, editorId);
      return {
        ok: false,
        error: `প্রকাশনার অনুমতি সংরক্ষণ হয়নি: ${settingsError.message}${rollbackError ? ` Auth ব্যবহারকারী মুছে ফেলা যায়নি: ${rollbackError}` : ''}`,
      };
    }

    revalidatePath('/admin/news/editors');
    return { ok: true, message: `নিউজ এডিটরের আমন্ত্রণ ${email} ঠিকানায় পাঠানো হয়েছে।` };
  } catch (error) {
    console.error('[news-editors] invite failed:', error);
    return {
      ok: false,
      error: error instanceof Error ? `আমন্ত্রণ পাঠানো যায়নি: ${error.message}` : 'আমন্ত্রণ পাঠানো যায়নি।',
    };
  }
}

export async function setNewsEditorActive(
  editorId: string,
  active: boolean
): Promise<NewsEditorActionResult> {
  const admin = await getVerifiedNewsAdmin();
  if (!admin) return { ok: false, error: 'শুধু প্রধান অ্যাডমিন এডিটর অ্যাকাউন্ট পরিচালনা করতে পারবেন।' };
  if (!isUuid(editorId) || typeof active !== 'boolean') {
    return { ok: false, error: 'এডিটর বা অ্যাকাউন্টের অবস্থা সঠিক নয়।' };
  }

  const { data, error } = await admin.client
    .from('profiles')
    .update({ status: active ? 'active' : 'suspended' })
    .eq('id', editorId)
    .eq('role', 'news_editor')
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: `অ্যাকাউন্টের অবস্থা বদলানো যায়নি: ${error.message}` };
  if (!data) return { ok: false, error: 'নিউজ এডিটর অ্যাকাউন্টটি পাওয়া যায়নি।' };

  revalidatePath('/admin/news/editors');
  revalidatePath('/news/editor');
  return {
    ok: true,
    message: active ? 'নিউজ এডিটর অ্যাকাউন্ট সক্রিয় হয়েছে।' : 'নিউজ এডিটরের প্রবেশাধিকার বন্ধ হয়েছে।',
  };
}

export async function setNewsEditorPublishPermission(
  editorId: string,
  canPublish: boolean
): Promise<NewsEditorActionResult> {
  const admin = await getVerifiedNewsAdmin();
  if (!admin) return { ok: false, error: 'শুধু প্রধান অ্যাডমিন প্রকাশনার অনুমতি বদলাতে পারবেন।' };
  if (!isUuid(editorId) || typeof canPublish !== 'boolean') {
    return { ok: false, error: 'এডিটর বা অনুমতির মান সঠিক নয়।' };
  }

  const { data: profile, error: profileError } = await admin.client
    .from('profiles')
    .select('id')
    .eq('id', editorId)
    .eq('role', 'news_editor')
    .maybeSingle();
  if (profileError) return { ok: false, error: `এডিটর যাচাই করা যায়নি: ${profileError.message}` };
  if (!profile) return { ok: false, error: 'নিউজ এডিটর অ্যাকাউন্টটি পাওয়া যায়নি।' };

  const { error } = await admin.client
    .from('news_editor_settings')
    .upsert(
      { editor_id: editorId, can_publish: canPublish, created_by: admin.userId },
      { onConflict: 'editor_id' }
    );
  if (error) return { ok: false, error: `প্রকাশনার অনুমতি বদলানো যায়নি: ${error.message}` };

  revalidatePath('/admin/news/editors');
  revalidatePath('/news/editor');
  return {
    ok: true,
    message: canPublish ? 'এডিটর সরাসরি সংবাদ প্রকাশ করতে পারবেন।' : 'সংবাদ প্রকাশের আগে অ্যাডমিন অনুমোদন লাগবে।',
  };
}

export async function sendNewsEditorPasswordSetup(
  editorId: string
): Promise<NewsEditorActionResult> {
  const admin = await getVerifiedNewsAdmin();
  if (!admin) return { ok: false, error: 'শুধু প্রধান অ্যাডমিন পাসওয়ার্ড সেটআপ ইমেইল পাঠাতে পারবেন।' };
  if (!isUuid(editorId)) return { ok: false, error: 'এডিটর পরিচিতি সঠিক নয়।' };

  const { data: profile, error } = await admin.client
    .from('profiles')
    .select('email')
    .eq('id', editorId)
    .eq('role', 'news_editor')
    .maybeSingle();
  if (error) return { ok: false, error: `এডিটরের ইমেইল যাচাই হয়নি: ${error.message}` };
  if (!profile?.email) return { ok: false, error: 'এডিটরের ইমেইল ঠিকানা পাওয়া যায়নি।' };

  const mailClient = createRecoveryMailClient();
  if (!mailClient) return { ok: false, error: 'পাসওয়ার্ড ইমেইল পাঠানোর Auth সংযোগ কনফিগার করা নেই।' };

  const { error: mailError } = await mailClient.auth.resetPasswordForEmail(profile.email, {
    redirectTo: newsEditorRedirectUrl('/reset-password'),
  });
  if (mailError) return { ok: false, error: `পাসওয়ার্ড সেটআপ ইমেইল পাঠানো যায়নি: ${mailError.message}` };
  return { ok: true, message: `পাসওয়ার্ড সেটআপ/রিসেটের লিংক ${profile.email} ঠিকানায় পাঠানো হয়েছে।` };
}
