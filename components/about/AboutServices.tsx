import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Droplet,
  GraduationCap,
  Home,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel, LIGHT_FOCUS } from './AboutSectionBits';

const LEAD_SERVICE = {
  icon: Home,
  name: 'বাসা ভাড়া (To-Let)',
  text: 'ফ্যামিলি ফ্ল্যাট, ব্যাচেলর মেস, সাবলেট ও সিট ভাড়ার তথ্য এক জায়গায় — এলাকা ও ভাড়া অনুযায়ী খুঁজে নিন।',
  href: '/tolet',
  image: '/home.jpg',
  alt: 'ময়মনসিংহে ভাড়া বাসার তথ্য',
  links: [{ label: 'সেবা দেখুন', href: '/tolet' }],
};

const SERVICES = [
  {
    icon: Sparkles,
    name: 'কাজের বুয়া',
    text: 'রান্না, পরিষ্কার ও ঘরের কাজের জন্য ভরসাযোগ্য গৃহকর্মী।',
    links: [{ label: 'সেবা দেখুন', href: '/kajer-bua' }],
  },
  {
    icon: Zap,
    name: 'ইলেক্ট্রিশিয়ান ও প্লাম্বার',
    text: 'শর্টসার্কিট, ওয়্যারিং, পাইপ লিক ও স্যানিটারি মেরামত।',
    links: [
      { label: 'ইলেক্ট্রিশিয়ান', href: '/electrician' },
      { label: 'প্লাম্বার', href: '/plumber' },
    ],
  },
  {
    icon: Truck,
    name: 'বাসা পাল্টানো',
    text: 'পিকআপ ও লোডিং সহ নিরাপদ, ঝামেলাহীন শিফটিং।',
    links: [{ label: 'সেবা দেখুন', href: '/home-moving' }],
  },
  {
    icon: GraduationCap,
    name: 'গৃহশিক্ষক',
    text: 'ময়মনসিংহের অভিজ্ঞ টিউটর — ক্লাস, মাধ্যম বা বিষয় অনুযায়ী।',
    links: [{ label: 'সেবা দেখুন', href: '/home-tutor' }],
  },
  {
    icon: Droplet,
    name: 'রক্তদাতা',
    text: 'জরুরি প্রয়োজনে স্বেচ্ছাসেবী রক্তদাতাদের সঙ্গে দ্রুত সমন্বয়।',
    links: [{ label: 'সেবা দেখুন', href: '/blood-donor' }],
  },
];

/**
 * AboutServices — the current catalogue, shown editorially.
 *
 * One lead card with real local imagery, then hairline-divided rows instead of
 * six identical tiles. Two columns on tablet, stacked rows on mobile.
 */
export default function AboutServices() {
  return (
    <AboutSection labelledBy="about-services-heading" className="bg-white">
      <Reveal>
        <SectionLabel>আমাদের সেবাসমূহ</SectionLabel>
        <h2
          id="about-services-heading"
          className="mt-3 max-w-2xl text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
        >
          আজকের জন্য চালু থাকা সেবাসমূহ
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
          প্রতিটি সেবার আলাদা পাতা আছে — সেখানে সেবার ধরন, এলাকা ও প্রোফাইল দেখে
          নিজের প্রয়োজন অনুযায়ী সিদ্ধান্ত নিতে পারবেন।
        </p>
      </Reveal>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <Reveal>
          <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-mist-50">
            <div className="relative aspect-[16/10] w-full bg-brand-100">
              <Image
                src={LEAD_SERVICE.image}
                alt={LEAD_SERVICE.alt}
                fill
                sizes="(max-width: 1023px) 92vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                <LEAD_SERVICE.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-ink-900">
                {LEAD_SERVICE.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {LEAD_SERVICE.text}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                {LEAD_SERVICE.links.map((link) => (
                  <ServiceLink key={link.href} {...link} />
                ))}
              </div>
            </div>
          </article>
        </Reveal>

        <ul className="grid gap-x-8 sm:grid-cols-2 sm:gap-y-1">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            const isLast = index === SERVICES.length - 1;
            return (
              <Reveal
                as="li"
                key={service.name}
                delay={index * 60}
                className={`border-b border-brand-200 py-4 ${
                  isLast ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-extrabold text-ink-900">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {service.text}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                      {service.links.map((link) => (
                        <ServiceLink key={link.href} {...link} subtle />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>

      <Reveal delay={80} className="mt-7">
        <Link
          href="/services"
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-brand-300 px-5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-100/60 sm:w-auto ${LIGHT_FOCUS}`}
        >
          সব সেবা দেখুন
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Reveal>
    </AboutSection>
  );
}

function ServiceLink({
  label,
  href,
  subtle = false,
}: {
  label: string;
  href: string;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        subtle
          ? `inline-flex min-h-[32px] items-center gap-1 text-[13px] font-bold text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-900 ${LIGHT_FOCUS}`
          : `inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`
      }
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}
