'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

/**
 * Report moderation across all five report tables.
 *
 * The tables are addressed by name because they have different columns and no
 * shared key. Resolving a report is a single status write; the interesting
 * part is that the admin is then expected to act on the underlying content,
 * which is why the report row links straight to the queue that owns it.
 */

const REPORT_TABLES = [
  'listing_reports',
  'staff_profile_reports',
  'tutor_reports',
  'blood_donor_reports',
  'community_post_reports',
] as const;

type ReportTable = (typeof REPORT_TABLES)[number];

function isReportTable(value: string): value is ReportTable {
  return (REPORT_TABLES as readonly string[]).includes(value);
}

export async function setReportStatus(
  table: string,
  reportId: string,
  status: 'open' | 'resolved' | 'dismissed'
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isReportTable(table)) {
      return { ok: false, error: 'অজানা রিপোর্ট ধরন।' };
    }

    const { error } = await client
      .from(table)
      .update({ status })
      .eq('id', reportId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/reports');
    return {
      ok: true,
      message:
        status === 'resolved'
          ? 'রিপোর্ট সমাধান হয়েছে হিসেবে চিহ্নিত করা হয়েছে।'
          : status === 'dismissed'
            ? 'রিপোর্ট বাতিল করা হয়েছে।'
            : 'রিপোর্ট আবার খোলা অবস্থায় ফেরত এনেছে।',
    };
  });
}

export async function deleteReport(table: string, reportId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isReportTable(table)) {
      return { ok: false, error: 'অজানা রিপোর্ট ধরন।' };
    }

    const { error } = await client.from(table).delete().eq('id', reportId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/reports');
    return { ok: true, message: 'রিপোর্টটি মুছে ফেলা হয়েছে।' };
  });
}