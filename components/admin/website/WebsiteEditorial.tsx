'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2 } from 'lucide-react';
import { saveSiteContent } from '@/app/admin/actions/settings';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_FOOTER_CONTENT,
  type SiteContentOverrides,
} from '@/lib/site-content';

type LinkRow = { label: string; href: string };
type FaqRow = { question: string; answer: string };

export default function WebsiteEditorial({
  overrides,
}: {
  overrides: SiteContentOverrides;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState(overrides.announcement ?? {
    enabled: false,
    title: '',
    body: '',
    href: null,
    linkLabel: null,
  });
  const [about, setAbout] = useState(overrides.about_content ?? DEFAULT_ABOUT_CONTENT);
  const [faqs, setFaqs] = useState<FaqRow[]>(overrides.faq_content ?? DEFAULT_FAQ_CONTENT);
  const [footer, setFooter] = useState(overrides.footer_content ?? DEFAULT_FOOTER_CONTENT);
  const [seo, setSeo] = useState(overrides.seo ?? { title: '', description: '', ogImage: null });

  const save = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      const result = await saveSiteContent(key, value);
      if (!result.ok) {
        notify('error', 'সংরক্ষণ করা যায়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'ওয়েবসাইটের কনটেন্ট সংরক্ষিত হয়েছে।');
      router.refresh();
    } catch (error) {
      notify('error', 'সংরক্ষণ করা যায়নি', error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (
    group: 'companyLinks' | 'supportLinks',
    index: number,
    patch: Partial<LinkRow>
  ) => {
    setFooter((current) => ({
      ...current,
      [group]: current[group].map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border border-admin-border p-4">
        <div>
          <h3 className="text-sm font-bold text-admin-text">হোমপেজ ঘোষণা</h3>
          <p className="mt-1 text-xs text-admin-muted">সক্রিয় করলে হোমপেজের হিরো ক্যারোসেলের উপরে দেখাবে।</p>
        </div>
        <label className="flex min-h-10 items-center gap-2 text-sm text-admin-text">
          <input
            type="checkbox"
            checked={announcement.enabled}
            onChange={(event) => setAnnouncement((item) => ({ ...item, enabled: event.target.checked }))}
          />
          ঘোষণা প্রকাশ করুন
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="শিরোনাম" maxLength={120} value={announcement.title} onChange={(event) => setAnnouncement((item) => ({ ...item, title: event.target.value }))} />
          <Input label="লিংকের নাম (ঐচ্ছিক)" maxLength={60} value={announcement.linkLabel ?? ''} onChange={(event) => setAnnouncement((item) => ({ ...item, linkLabel: event.target.value || null }))} />
        </div>
        <Textarea label="বার্তা" maxLength={500} rows={3} value={announcement.body} onChange={(event) => setAnnouncement((item) => ({ ...item, body: event.target.value }))} />
        <Input label="সাইটের অভ্যন্তরীণ লিংক (ঐচ্ছিক)" value={announcement.href ?? ''} onChange={(event) => setAnnouncement((item) => ({ ...item, href: event.target.value || null }))} placeholder="/services" />
        <Button onClick={() => void save('announcement', announcement)} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>ঘোষণা সংরক্ষণ</Button>
        {announcement.title && announcement.body && (
          <div className="rounded-md border border-accent-500/30 bg-accent-100 p-3 text-brand-950">
            <p className="text-xs font-bold">প্রিভিউ · {announcement.title}</p>
            <p className="mt-1 text-sm">{announcement.body}</p>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-admin-border p-4">
        <div>
          <h3 className="text-sm font-bold text-admin-text">About Us — পরিচিতি</h3>
          <p className="mt-1 text-xs text-admin-muted">/about পেজের প্রথম শিরোনাম ও পরিচিতির অনুচ্ছেদ; বাকি বিদ্যমান পেজ কনটেন্ট অক্ষত থাকবে।</p>
        </div>
        <Input label="শিরোনাম" maxLength={160} value={about.heading} onChange={(event) => setAbout((item) => ({ ...item, heading: event.target.value }))} />
        <Textarea label="পরিচিতি" maxLength={1500} rows={4} value={about.intro} onChange={(event) => setAbout((item) => ({ ...item, intro: event.target.value }))} />
        <Button onClick={() => void save('about_content', about)} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>About Us সংরক্ষণ</Button>
        <div className="rounded-md border border-admin-border bg-admin-page p-3">
          <p className="text-sm font-bold text-admin-text">{about.heading}</p>
          <p className="mt-1 text-sm leading-relaxed text-admin-muted">{about.intro}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-admin-border p-4">
        <div>
          <h3 className="text-sm font-bold text-admin-text">FAQ</h3>
          <p className="mt-1 text-xs text-admin-muted">/help পেজে প্রকাশিত প্রশ্নোত্তর। সরানো প্রশ্নগুলো সংরক্ষণের পর আর প্রকাশ হবে না।</p>
        </div>
        {faqs.map((faq, index) => (
          <div key={index} className="space-y-2 rounded-md border border-admin-border p-3">
            <Input label={`প্রশ্ন ${index + 1}`} maxLength={240} value={faq.question} onChange={(event) => setFaqs((items) => items.map((item, row) => row === index ? { ...item, question: event.target.value } : item))} />
            <Textarea label="উত্তর" maxLength={1500} rows={3} value={faq.answer} onChange={(event) => setFaqs((items) => items.map((item, row) => row === index ? { ...item, answer: event.target.value } : item))} />
            <button type="button" onClick={() => setFaqs((items) => items.filter((_, row) => row !== index))} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-status-danger"><Trash2 className="h-4 w-4" /> সরান</button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setFaqs((items) => [...items, { question: '', answer: '' }])} leftIcon={<Plus className="h-4 w-4" />}>প্রশ্ন যোগ</Button>
          <Button onClick={() => void save('faq_content', faqs)} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>FAQ সংরক্ষণ</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-admin-border p-4">
        <div>
          <h3 className="text-sm font-bold text-admin-text">Footer কনটেন্ট ও লিংক</h3>
          <p className="mt-1 text-xs text-admin-muted">লিংক অবশ্যই সাইটের অভ্যন্তরীণ পাথ হতে হবে, যেমন /about।</p>
        </div>
        <Textarea label="বর্ণনা" maxLength={500} rows={3} value={footer.description} onChange={(event) => setFooter((item) => ({ ...item, description: event.target.value }))} />
        {(['companyLinks', 'supportLinks'] as const).map((group) => (
          <div key={group} className="space-y-2">
            <h4 className="text-xs font-bold text-admin-text">{group === 'companyLinks' ? 'কোম্পানি লিংক' : 'সহায়তা লিংক'}</h4>
            {footer[group].map((link, index) => (
              <div key={`${group}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input label="লেবেল" value={link.label} onChange={(event) => updateLink(group, index, { label: event.target.value })} />
                <Input label="পাথ" value={link.href} onChange={(event) => updateLink(group, index, { href: event.target.value })} placeholder="/contact" />
                <button type="button" aria-label="লিংক সরান" onClick={() => setFooter((item) => ({ ...item, [group]: item[group].filter((_, row) => row !== index) }))} className="mt-6 flex h-10 w-10 items-center justify-center rounded-md border border-status-danger text-status-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => setFooter((item) => ({ ...item, [group]: [...item[group], { label: '', href: '' }] }))} leftIcon={<Plus className="h-4 w-4" />}>লিংক যোগ</Button>
          </div>
        ))}
        <Button onClick={() => void save('footer_content', footer)} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>Footer সংরক্ষণ</Button>
      </section>

      <section className="space-y-3 rounded-lg border border-admin-border p-4">
        <div>
          <h3 className="text-sm font-bold text-admin-text">SEO ও সামাজিক শেয়ার</h3>
          <p className="mt-1 text-xs text-admin-muted">সাইটের ডিফল্ট title, description এবং social-sharing image। খালি রাখলে বর্তমান ব্র্যান্ড ডিফল্ট থাকবে।</p>
        </div>
        <Input label="SEO শিরোনাম" maxLength={120} value={seo.title} onChange={(event) => setSeo((item) => ({ ...item, title: event.target.value }))} />
        <Textarea label="SEO বিবরণ" maxLength={320} rows={3} value={seo.description} onChange={(event) => setSeo((item) => ({ ...item, description: event.target.value }))} />
        <Input label="শেয়ারিং ছবির URL" value={seo.ogImage ?? ''} onChange={(event) => setSeo((item) => ({ ...item, ogImage: event.target.value || null }))} placeholder="/og-image.png অথবা https://..." />
        <Button onClick={() => void save('seo', seo)} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>SEO সংরক্ষণ</Button>
      </section>
    </div>
  );
}
