import Link from 'next/link';
import { ArrowRight, Droplet, Flame, Phone, ShieldCheck, Stethoscope } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';

const EMERGENCY_CONTACTS = [
  {
    icon: Stethoscope,
    name: 'ডাক্তার',
    note: 'চিকিৎসা সহায়তা ও পরামর্শ',
    number: '১৬২৬৩',
    tel: 'tel:16263',
  },
  {
    icon: ShieldCheck,
    name: 'পুলিশ',
    note: 'নিরাপত্তা ও অপরাধ সংক্রান্ত জরুরি প্রয়োজনে',
    number: '৯৯৯',
    tel: 'tel:999',
  },
  {
    icon: Phone,
    name: 'অ্যাম্বুলেন্স',
    note: 'জরুরি রোগী পরিবহন',
    number: '৯৯৯',
    tel: 'tel:999',
  },
  {
    icon: Flame,
    name: 'ফায়ার সার্ভিস',
    note: 'অগ্নিনির্বাপণ ও উদ্ধার',
    number: '১০২',
    tel: 'tel:102',
  },
  {
    icon: Droplet,
    name: 'রক্ত',
    note: 'জরুরি রক্তের প্রয়োজন',
    number: '১৬২৬৩',
    tel: 'tel:16263',
  },
];

export default function EmergencyCallPage() {
  return (
    <RoutePlaceholderShell
      title="জরুরি প্রয়োজনে সরাসরি কল"
      subtitle="জরুরি অবস্থায় নিচের নম্বরে সরাসরি কল করুন। নম্বর না থাকা সেবাগুলোর জন্য প্ল্যাটফর্মে অনুরোধ পাঠালে অ্যাডমিন সংযুক্ত করে দেবে।"
      categoryBadge="জরুরি সেবা"
      breadcrumbs={[{ label: 'জরুরি কল' }]}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {EMERGENCY_CONTACTS.map((item) => {
          const inner = (
            <>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700">
                <item.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3.5 text-[15px] font-bold text-ink-900">{item.name}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.note}</p>
              <span className="mt-auto inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-brand-800">
                {item.number}
                <ArrowRight className="h-4 w-4" />
              </span>
            </>
          );

          return item.tel ? (
            <a
              key={item.name}
              href={item.tel}
              className="group flex h-full flex-col rounded-xl border border-brand-100/90 bg-white p-5 transition-colors hover:border-brand-700"
            >
              {inner}
            </a>
          ) : (
            <Link
              key={item.name}
              href="/how-it-works"
              className="group flex h-full flex-col rounded-xl border border-brand-100/90 bg-white p-5 transition-colors hover:border-brand-700"
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-brand-700 p-6 text-center sm:p-8">
        <h2 className="text-lg font-extrabold text-white sm:text-xl">সেবা নিতে চান?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-50">
          ফর্ম পূরণ করে অনুরোধ পাঠান — অ্যাডমিন যাচাই করে সঠিক সেবাদাতার সাথে সংযুক্ত করে দেবে।
        </p>
        <Link
          href="/how-it-works"
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-900 transition-colors hover:bg-brand-50 sm:w-auto"
        >
          কিভাবে কাজ করে দেখুন
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </RoutePlaceholderShell>
  );
}
