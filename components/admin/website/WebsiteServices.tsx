'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import type { ServiceOverride } from '@/lib/site-content';
import { saveSiteContent } from '@/app/admin/actions/settings';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

/**
 * Service catalog overrides.
 *
 * The built-in catalog stays the source of truth; this edits an override list
 * keyed by slug. "Reset" deletes the override and the site goes back to the
 * built-in value — which is the honest way to offer "undo" without keeping a
 * copy of the original that can drift.
 */
export default function WebsiteServices({ overrides }: { overrides: ServiceOverride[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [draft, setDraft] = useState<Record<string, ServiceOverride>>(() =>
    Object.fromEntries(overrides.map((o) => [o.slug, { ...o }]))
  );
  const [saving, setSaving] = useState(false);

  const slugs = Object.keys(draft);

  const update = (slug: string, patch: Partial<ServiceOverride>) => {
    setDraft((current) => ({
      ...current,
      [slug]: { ...current[slug], ...patch },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const list = slugs.map((slug) => draft[slug]);
      const result = await saveSiteContent('launch_services', list);
      if (result.ok) {
        notify('success', 'সেবা তালিকা সংরক্ষিত হয়েছে');
        router.refresh();
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const reset = async (slug: string) => {
    setSaving(true);
    try {
      const remaining = slugs.filter((s) => s !== slug).map((s) => draft[s]);
      const result = await saveSiteContent('launch_services', remaining);
      if (result.ok) {
        setDraft((current) => {
          const next = { ...current };
          delete next[slug];
          return next;
        });
        notify('success', 'পুরনো মান ফেরত এনেছে');
        router.refresh();
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  if (slugs.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        এখনো কোনো সেবার নাম, বিবরণ বা ছবি পরিবর্তন করা হয়নি। ওয়েবসাইট বর্তমান
        তালিকা দেখাচ্ছে।
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">
        নিচের তালিকায় শুধুমাত্র সেসব সেবা আছে যেগুলোর কিছু পরিবর্তন করা হয়েছে।
        নতুন সেবা যোগ করতে বা সব রিসেট করতে নিচের বাটন ব্যবহার করুন।
      </p>

      {slugs.map((slug) => {
        const item = draft[slug];
        const isHidden = item.hidden === true;
        return (
          <div
            key={slug}
            className={cn(
              'rounded-xl border p-3',
              isHidden ? 'border-rose-200 bg-rose-50/40' : 'border-mist-200 bg-white'
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink-900">{slug}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => update(slug, { hidden: !isHidden })}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold',
                    isHidden
                      ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                      : 'border-mist-200 text-ink-600 hover:bg-mist-50'
                  )}
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> লুকানো
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> দৃশ্যমান
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => reset(slug)}
                  disabled={saving}
                  className="h-9 rounded-lg border border-mist-200 px-2.5 text-xs font-semibold text-ink-600 hover:bg-mist-50"
                >
                  রিসেট
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                label="বাংলা নাম"
                value={item.nameBn ?? ''}
                onChange={(e) => update(slug, { nameBn: e.target.value })}
              />
              <Input
                label="ইংরেজি নাম"
                value={item.nameEn ?? ''}
                onChange={(e) => update(slug, { nameEn: e.target.value })}
              />
            </div>
            <div className="mt-2">
              <Textarea
                label="সংক্ষিপ্ত বিবরণ"
                value={item.shortDesc ?? ''}
                onChange={(e) => update(slug, { shortDesc: e.target.value })}
                rows={2}
              />
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                label="ছবির ঠিকানা"
                value={item.coverImage ?? ''}
                onChange={(e) => update(slug, { coverImage: e.target.value })}
                placeholder="/image.jpg"
              />
              <Input
                label="ক্রম"
                type="number"
                value={item.sort_order ?? 0}
                onChange={(e) =>
                  update(slug, { sort_order: Number.parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </div>
        );
      })}

      <div className="flex justify-end border-t border-mist-100 pt-3">
        <Button onClick={save} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
          সব পরিবর্তন সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}