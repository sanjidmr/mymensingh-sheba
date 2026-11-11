import { HelpCircle } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { getSiteContentOverrides } from '@/lib/site-content-server';
import { DEFAULT_FAQ_CONTENT } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export default async function HelpPage() {
  const overrides = await getSiteContentOverrides();
  const faqs = overrides.faq_content ?? DEFAULT_FAQ_CONTENT;

  return (
    <RoutePlaceholderShell
      title="সাহায্য ও সাধারণ জিজ্ঞাসা (FAQ)"
      subtitle="ময়মনসিংহ সেবা ব্যবহারের নিয়মাবলী ও সচরাচর জানতে চাওয়া প্রশ্নগুলোর উত্তর।"
      categoryBadge="সহায়তা কেন্দ্র"
      breadcrumbs={[{ label: 'সাহায্য' }]}
    >
      <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        {faqs.map((faq, index) => (
          <div key={`${faq.question}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="mb-2 flex items-start gap-2 text-base font-bold text-slate-900">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>{faq.question}</span>
            </h2>
            <p className="pl-6 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </RoutePlaceholderShell>
  );
}
