import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Flag, Info, ShieldCheck, UserCheck } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel, LIGHT_FOCUS } from './AboutSectionBits';

const TRUST_POINTS = [
  {
    icon: UserCheck,
    title: 'প্রয়োজনীয় তথ্য স্পষ্টভাবে দেখানো',
    text: 'প্রোফাইলে কী তথ্য আছে, কী নেই — তা স্পষ্টভাবে উল্লেখ থাকে, যাতে ভুল ধারণা না হয়।',
  },
  {
    icon: Flag,
    title: 'সন্দেহজনক তথ্য রিপোর্ট করার সুযোগ',
    text: 'কোনো তথ্য ভুল বা অবাস্তব মনে হলে আমাদের জানানো যায় — অপ্রয়োজনীয় তথ্য সরিয়ে ফেলা হয়।',
  },
  {
    icon: AlertTriangle,
    title: 'সতর্ক থাকার পরামর্শ',
    text: 'অর্ডার করার আগে সেবাদেওয়া, এলাকা, সময় ও শর্ত নিজে যাচাই করে নেওয়া ভালো।',
  },
  {
    icon: ShieldCheck,
    title: 'গোপনীয়তার যত্ন',
    text: 'ফোন নম্বর বা ব্যক্তিগত তথ্য সরাসরি প্রকাশ না করে নিরাপদ অনুরোধ প্রক্রিয়ায় রাখা হয়।',
  },
  {
    icon: Info,
    title: 'যাচাই ব্যবস্থা ধাপে ধাপে উন্নত হচ্ছে',
    text: 'ভবিষ্যতে যাচাই ও মান নিশ্চিত করার ব্যবস্থা আরও শক্তিশালী করা হবে।',
  },
];

/**
 * AboutTrust — trust is built with transparency, not exaggerated claims.
 * The note below is deliberate: we never present the whole directory as
 * pre-verified while verification is still being rolled out.
 */
export default function AboutTrust() {
  return (
    <AboutSection labelledBy="about-trust-heading" className="bg-white">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <Reveal>
          <SectionLabel>বিশ্বাস ও নিরাপত্তা</SectionLabel>
          <h2
            id="about-trust-heading"
            className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
          >
            স্বচ্ছতাই আমাদের প্রথম অঙ্গীকার
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Mymensingh Sheba একটি দায়িত্বপূর্ণ প্ল্যাটফর্ম হিসেবে কাজ করতে চায়। তাই
            আমরা অতিরঞ্জিত দাবি করি না — যা জানা যায় তা স্পষ্টভাবে জানানো হয়, আর
            যা এখনো যাচাই করা হয়নি তা হিসেবে চিহ্নিত রাখা হয়।
          </p>

          <p className="mt-4 rounded-xl border border-bronze-200 bg-bronze-50 p-4 text-sm leading-relaxed text-ink-700">
            <strong className="font-extrabold text-ink-900">একটি কথা স্পষ্ট করে রাখি:</strong>{' '}
            দিন্দিন বাড়তে থাকা একটি প্ল্যাটফর্মে প্রতিটি তথ্য ইতোমধ্যে যাচাই করা হয়েছে —
            এমন দাবি আমরা করি না।
          </p>

          <Link
            href="/contact"
            className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-brand-300 px-5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-100/60 sm:w-auto ${LIGHT_FOCUS}`}
          >
            সন্দেহজনক তথ্য জানান
          </Link>
        </Reveal>

        <ul className="space-y-4">
          {TRUST_POINTS.map((point, index) => {
            const Icon = point.icon;
            return (
              <Reveal
                as="li"
                key={point.title}
                delay={index * 60}
                className="flex gap-4 border-b border-brand-100 pb-4 last:border-b-0 last:pb-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-brand-600"
                      aria-hidden="true"
                    />
                    {point.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {point.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </AboutSection>
  );
}
