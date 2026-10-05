'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saveSiteContent, deleteSiteContent } from '@/app/admin/actions/settings';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { HOMEPAGE_SECTIONS } from '@/lib/site-content';

type SectionDef = (typeof HOMEPAGE_SECTIONS)[number];

/**
 * Homepage section visibility toggles.
 *
 * Each switch writes immediately on change rather than waiting for a "save"
 * button: a toggle that needs a save is a toggle whose state the admin cannot
 * see, and the previous admin pages were full of forms that looked saved but
 * were not.
 */
export default function WebsiteSections({
  sections,
  overrides,
}: {
  sections: readonly SectionDef[];
  overrides: Record<string, boolean>;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const isVisible = (key: string) => {
    const flag = overrides[key];
    return flag === undefined ? true : Boolean(flag);
  };

  const toggle = async (key: string, label: string) => {
    const next = !isVisible(key);
    setPending(key);
    try {
      const result = await saveSiteContent('homepage_sections', {
        ...overrides,
        [key]: next,
      });
      if (result.ok) {
        notify('success', next ? `${label} চালু হয়েছে` : `${label} বন্ধ হয়েছে`);
        router.refresh();
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error);
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <ul className="divide-y divide-mist-100">
      {sections.map((section) => {
        const visible = isVisible(section.key);
        const isPending = pending === section.key;
        return (
          <li
            key={section.key}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="min-w-0 text-sm text-ink-800">{section.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={visible}
              aria-label={`${section.label} ${visible ? 'বন্ধ করুন' : 'চালু করুন'}`}
              disabled={isPending}
              onClick={() => toggle(section.key, section.label)}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
                visible ? 'bg-brand-600' : 'bg-mist-200',
                isPending && 'opacity-60'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                  visible ? 'translate-x-6' : 'translate-x-1'
                )}
                aria-hidden="true"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}