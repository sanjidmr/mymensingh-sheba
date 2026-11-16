'use client';

import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { saveServiceSeoSettings } from '@/app/admin/actions/settings';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { ServiceSeoEntry } from '@/lib/site-content';

const SERVICE_OPTIONS = [
  { slug: 'kajer-bua', label: 'কাজের বুয়া' },
  { slug: 'electrician', label: 'ইলেকট্রিশিয়ান' },
  { slug: 'plumber', label: 'প্লাম্বার' },
  { slug: 'home-moving', label: 'বাসা পাল্টানো' },
  { slug: 'ac-fridge', label: 'এসি ও ফ্রিজ' },
  { slug: 'tolet', label: 'বাসা ভাড়া' },
  { slug: 'home-tutor', label: 'গৃহশিক্ষক' },
  { slug: 'blood-donor', label: 'রক্তদাতা' },
  { slug: 'coaching', label: 'কোচিং' },
  { slug: 'jobs', label: 'চাকরি' },
  { slug: 'news', label: 'খবর' },
  { slug: 'wifi', label: 'WiFi' },
];

function normalizeInput(value: string | undefined) {
  return value ?? '';
}

export default function WebsiteServiceSeo({
  serviceSeo,
}: {
  serviceSeo: Record<string, ServiceSeoEntry>;
}) {
  const { notify } = useToast();
  const [selectedSlug, setSelectedSlug] = useState('kajer-bua');
  const [draft, setDraft] = useState<Record<string, ServiceSeoEntry>>(() => serviceSeo);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => draft[selectedSlug] ?? {}, [draft, selectedSlug]);
  const metrics = useMemo(() => {
    const fields = [
      selected.seoTitle,
      selected.metaDescription,
      selected.customH1,
      selected.ogTitle,
      selected.twitterTitle,
    ].filter(Boolean);
    const missing = fields.length < 4 ? 'অনেক ফিল্ড খালি আছে' : 'সর্বোত্তম';
    const duplicate = selected.focusKeyword && selected.secondaryKeywords?.some((item) => item.toLowerCase() === selected.focusKeyword?.toLowerCase());
    return {
      missing,
      duplicate: duplicate ? 'ডুপ্লিকেট কীওয়ার্ড' : 'স্বাভাবিক',
    };
  }, [selected]);

  const save = async () => {
    setSaving(true);
    try {
      const result = await saveServiceSeoSettings({ [selectedSlug]: draft[selectedSlug] ?? {} });
      if (!result.ok) {
        notify('error', 'SEO সংরক্ষণ করা যায়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'SEO সংরক্ষণ হয়েছে');
    } catch (error) {
      notify('error', 'SEO সংরক্ষণ করা যায়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SERVICE_OPTIONS.map((service) => (
          <button
            key={service.slug}
            type="button"
            onClick={() => setSelectedSlug(service.slug)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedSlug === service.slug ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-admin-border bg-white text-admin-text'}`}
          >
            {service.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-page p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-admin-muted">SEO health</p>
            <h4 className="text-base font-bold text-admin-text">{SERVICE_OPTIONS.find((item) => item.slug === selectedSlug)?.label}</h4>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Missing: {metrics.missing}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Duplicate: {metrics.duplicate}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="SEO Title"
            value={normalizeInput(selected.seoTitle)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), seoTitle: event.target.value } }))}
          />
          <Input
            label="Canonical URL"
            value={normalizeInput(selected.canonicalUrl)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), canonicalUrl: event.target.value } }))}
          />
          <Input
            label="Focus Keyword"
            value={normalizeInput(selected.focusKeyword)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), focusKeyword: event.target.value } }))}
          />
          <Input
            label="Custom H1"
            value={normalizeInput(selected.customH1)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), customH1: event.target.value } }))}
          />
          <Input
            label="OG Title"
            value={normalizeInput(selected.ogTitle)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), ogTitle: event.target.value } }))}
          />
          <Input
            label="Twitter Title"
            value={normalizeInput(selected.twitterTitle)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), twitterTitle: event.target.value } }))}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Textarea
            label="Meta Description"
            value={normalizeInput(selected.metaDescription)}
            rows={3}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), metaDescription: event.target.value } }))}
          />
          <Textarea
            label="SEO Description"
            value={normalizeInput(selected.seoDescription)}
            rows={3}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), seoDescription: event.target.value } }))}
          />
          <Textarea
            label="OG Description"
            value={normalizeInput(selected.ogDescription)}
            rows={3}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), ogDescription: event.target.value } }))}
          />
          <Textarea
            label="Twitter Description"
            value={normalizeInput(selected.twitterDescription)}
            rows={3}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), twitterDescription: event.target.value } }))}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input
            label="Secondary Keywords (comma separated)"
            value={(selected.secondaryKeywords ?? []).join(', ')}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), secondaryKeywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) } }))}
          />
          <Input
            label="Image Alt Text"
            value={normalizeInput(selected.imageAlt)}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), imageAlt: event.target.value } }))}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <input
            id="index-check"
            type="checkbox"
            checked={selected.index !== false}
            onChange={(event) => setDraft((current) => ({ ...current, [selectedSlug]: { ...(current[selectedSlug] ?? {}), index: event.target.checked } }))}
          />
          <label htmlFor="index-check">This service page should be indexed</label>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => void save()} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Save Service SEO
          </Button>
        </div>
      </div>
    </div>
  );
}
