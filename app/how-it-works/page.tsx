import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bus,
  Car,
  CheckCircle2,
  ClipboardList,
  Droplet,
  Flame,
  GraduationCap,
  HeartHandshake,
  Home,
  Info,
  Lock,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Truck,
  UserCheck,
  Wifi,
  Wind,
  Wrench,
  Zap,
  BookOpen,
  Briefcase,
  Newspaper,
} from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import BloodDonorCard from '@/components/how-it-works/BloodDonorCard';

const TAKING_STEPS = [
  {
    icon: Search,
    step: 'ধাপ ১',
    title: 'সেবা নিতে চান',
    text: 'যেকোনো সেবা নেওয়ার পুরো প্রক্রিয়া তিনটি ধাপে।',
    points: [
      'নিবন্ধন/লগইন করুন',
      'প্রয়োজন অনুযায়ী সেবা বেছে নিন',
      'ফর্ম পূরণ করলেই বিজ্ঞাপন তৈরি হয়',
      'অ্যাডমিন যাচাই করার পর সেটি সবার জন্য দেখা যায়',
    ],
  },
  {
    icon: ClipboardList,
    step: 'ধাপ ২',
    title: 'অনুরোধ বা যোগাযোগ জানান',
    text: 'কার্ডের ভেতরে থাকা "অনুরোধ করুন" ফর্মে সময় ও এলাকা লিখে পাঠান। অনুরোধটি সরাসরি প্ল্যাটফর্মের মাধ্যমেই কর্মী ও অ্যাডমিনের কাছে পৌঁছে যায়।',
    points: ['সময় ও এলাকা লিখে পাঠান', 'যা যা লাগবে বিস্তারিত লিখুন', 'অনুরোধ ট্র্যাক করা যায়'],
  },
  {
    icon: CheckCircle2,
    step: 'ধাপ ৩',
    title: 'কাজ নিশ্চিত করুন',
    text: 'অ্যাডমিন অনুরোধ যাচাই করে সঠিক সেবাদাতার সাথে জুড়ে দেয়। আপনার "আমার অনুরোধ" পেজ থেকে অগ্রগতি দেখুন এবং কাজ শেষে ফিডব্যাক দিন।',
    points: ['অ্যাডমিন ভেরিফাই', 'আমার অনুরোধ পেজে স্ট্যাটাস', 'রিভিউ ও রেটিং'],
  },
];

const SELF_POST = [
  {
    icon: Home,
    name: 'বাসা ভাড়া (To-Let)',
    text: 'ফ্ল্যাট, মেস, সাবলেট, হোস্টেল বা সিট ভাড়ার বিজ্ঞাপন নিজে পোস্ট করুন — কোনো মধ্যস্বত্বভোগী নেই।',
    points: [
      'লগইন করে ফর্ম পূরণ করে সরাসরি পোস্ট',
      'প্ল্যাটফর্ম ফি একবার মাত্র — মেস/সিট ৳৫০ · ১০ হাজার পর্যন্ত ৳১০০ · ১০–২০ হাজার ৳২০০ · ২০ হাজারের বেশি ৳৪০০',
      'ভাড়ার দর বাড়লে পোস্টটি ডিলিট করে দেওয়া হবে',
    ],
    href: '/profile/tolet/new',
    cta: 'বাসা ভাড়া পোস্ট করুন',
  },
  {
    icon: Briefcase,
    name: 'চাকরির বিজ্ঞপ্তি',
    text: 'শহরের নতুন চাকরির বিজ্ঞপ্তি — এক জায়গায় নিয়মিত আপডেট',
    points: [
      'পদের ধরন, শিক্ষাগত যোগ্যতা ও শর্ত লিখে দিন',
      'সংস্থার নাম ও আবেদনের শেষ তারিখ দিন',
      'অ্যাডমিন যাচাই করার পর সবার জন্য দেখা যায়',
    ],
    href: '/services/jobs',
    cta: 'চাকরির বিজ্ঞপ্তি পোস্ট করুন',
  },
  {
    icon: ShoppingBag,
    name: 'কেনাবেচা',
    text: 'দ্বিতীয় হাতের জিনিস থেকে স্থানীয় কেনাবেচা — বাজার হাতের কাছে।',
    points: [
      'পণ্যের নাম, দাম ও ছবি যোগ করুন',
      'বিক্রেতা ও ক্রেতার এলাকা উল্লেখ করুন',
      'অ্যাডমিন যাচাই করার পর সবার জন্য দেখা যায়',
    ],
    href: '/services/buysell',
    cta: 'কেনাবেচার পোস্ট করুন',
  },
  {
    icon: Newspaper,
    name: 'নিউজ ও ঘোষণা',
    text: 'ময়মনসিংহের প্রয়োজনীয় খবর ও ঘোষণা, অবিলম্বে',
    points: [
      'খবরের শিরোনাম ও বিস্তারিত লিখুন',
      'প্রযোজ্য হলে ছবি সহ সংযুক্ত করুন',
      'অ্যাডমিন যাচাই করার পর সবার জন্য দেখা যায়',
    ],
    href: '/services/news',
    cta: 'খবর পোস্ট করুন',
    compact: true,
  },
  {
    icon: GraduationCap,
    name: 'গৃহশিক্ষক (Home Tutor)',
    text: 'পড়ানোর যোগ্যতা ও অভিজ্ঞতা থাকলে নিজের শিক্ষক প্রোফাইল তৈরি করে ফি দিন।',
    points: [
      'বিষয়, ক্লাস, মাধ্যম ও ফি নিজে ঠিক করুন',
      'পড়ানোর এলাকা ও সময় উল্লেখ করুন',
      'অ্যাডমিন যাচাই করার পর তালিকায় দেখা যাবে',
    ],
    href: '/profile/home-tutor/setup',
    cta: 'শিক্ষক প্রোফাইল তৈরি করুন',
    compact: true,
  },
  {
    icon: HeartHandshake,
    name: 'রক্তদাতা',
    text: 'রক্ত দেওয়ার ইচ্ছুক ব্যক্তিরা নিজেই রক্তদাতা হিসেবে নিবন্ধন করতে পারেন।',
    points: [
      'রক্তের গ্রুপ, এলাকা ও ফোন নম্বর দিন',
      'নাম ও ঠিকানা সম্পূর্ণ গোপন থাকে',
      'যাচাই হলে জরুরি অনুরোধে সরাসরি যোগাযোগ করা যায়',
    ],
    href: '/profile/blood-donor/setup',
    cta: 'রক্তদাতা হিসেবে নিবন্ধন করুন',
    compact: true,
  },
];

const ADMIN_MANAGED = [
  {
    icon: Sparkles,
    name: 'কাজের বুয়া',
    text: 'যাচাইকৃত কর্মীর প্রোফাইল অ্যাডমিন টিম যোগ করে, তাই নিজে ছবি/পোস্ট দিতে হয় না — অনুরোধ পাঠালেই যোগাযোগ করানো হয়।',
  },
  {
    icon: Zap,
    name: 'ইলেকট্রিশিয়ান',
    text: 'ভেরিফাইড টেকনিশিয়ানের তালিকা অ্যাডমিন রাখে। আপনার সমস্যা লিখে অনুরোধ দিলে সঠিক টেকনিশিয়ান পাঠানো হয়।',
  },
  {
    icon: Wrench,
    name: 'প্লাম্বার',
    text: 'পাইপ লিক, মোটর-পাম্প ও স্যানিটারি কাজের জন্য ভেরিফাইড মিস্ত্রির সাথে অ্যাডমিন সমন্বয় করে।',
  },
  {
    icon: Truck,
    name: 'বাসা পাল্টানো',
    text: 'লোডিং-আনলোডিং ও শিফটিংয়ের অনুরোধ নিজে দিতে পারেন, তবে ট্রাক ও শ্রমিক সরবরাহে অ্যাডমিন সহায়তা করে।',
  },
  {
    icon: Wind,
    name: 'এসি ও ফ্রিজ মেরামত',
    text: 'সার্ভিসিংয়ের প্রোফাইল ও ভিজিট সময়স্পঞ্জ অ্যাডমিন নিয়ন্ত্রণ করে; জরুরি সমস্যায় সরাসরি অনুরোধ জানান।',
  },
  {
    icon: Car,
    name: 'গাড়ি, অটো ও CNG',
    text: 'স্থানীয় গাড়ি, অটো ও সিএনজি ভাড়ার কাজ অ্যাডমিন টিম সামলায় — যাতায়াতের প্রয়োজন লিখে অনুরোধ দিন।',
  },
  {
    icon: BookOpen,
    name: 'কোচিং',
    text: 'মেন্টরিং ও কোচিং ক্লাসের ভর্তি তথ্য অ্যাডমিন যাচাই করে; প্রয়োজন জানালে সঠিক প্রতিষ্ঠানের সাথে যুক্ত করা হবে।',
  },
  {
    icon: Wifi,
    name: 'WiFi',
    text: 'এলাকাভিত্তিক ইন্টারনেট প্যাকেজ অ্যাডমিন যাচাই করে; কোন প্যাকেজ চান তা জানালে সরবরাহকারীর সাথে সংযুক্ত করা হবে।',
  },
];

const HOTLINES = [
  { icon: Stethoscope, name: 'ডাক্তার' },
  { icon: ShieldCheck, name: 'পুলিশ' },
  { icon: Phone, name: 'অ্যাম্বুলেন্স' },
  { icon: Flame, name: 'ফায়ার সার্ভিস' },
  { icon: Droplet, name: 'রক্ত' },
];

const INFO_SERVICES = [
  { icon: Bus, name: 'বাস টিকিট' },
  { icon: Briefcase, name: 'চাকরির বিজ্ঞপ্তি' },
  { icon: ShoppingBag, name: 'কেনাবেচা' },
  { icon: Newspaper, name: 'নিউজ ও ঘোষণা' },
  { icon: Wifi, name: 'WiFi' },
  { icon: BookOpen, name: 'কোচিং' },
  { icon: Stethoscope, name: 'ডাক্তার' },
  { icon: Droplet, name: 'রক্তদাতা' },
  { icon: ShieldCheck, name: 'পুলিশ' },
  { icon: Flame, name: 'ফায়ার সার্ভিস' },
  { icon: Phone, name: 'হেল্পলাইন' },
];

const RULES = [
  {
    icon: Lock,
    title: 'নম্বর ও ঠিকানা সুরক্ষিত',
    text: 'কর্মী ও মালিকের ফোন নম্বর সরাসরি উন্মুক্ত থাকে না; যোগাযোগ প্ল্যাটফর্মের মাধ্যমে হয়।',
  },
  {
    icon: UserCheck,
    title: 'অ্যাডমিন ভেরিফাই',
    text: 'কর্মী ও প্রোফাইল যাচাই করে তবেই প্রকাশ করা হয়। প্রতারণামূলক তথ্য বা ভুয়া প্রোফাইল সরিয়ে ফেলা হয়।',
  },
  {
    icon: MessageSquare,
    title: 'অভিযোগ ও সহায়তা',
    text: 'কোনো সমস্যা বা অভিযোগ থাকলে কার্ডের "অভিযোগ জানান" অপশনে অথবা যোগাযোগ পেজ থেকে জানাতে পারেন।',
  },
];

function SectionHeading({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
        {kicker}
      </span>
      <h2 className="mx-auto mt-2 max-w-2xl text-balance text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-2xl">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-balance text-sm leading-relaxed text-ink-500">{text}</p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <RoutePlaceholderShell
      title="কিভাবে কাজ করে"
      subtitle="সেবা নেওয়া থেকে শুরু করে নিজের প্রোফাইল পোস্ট করা — কোন সেবায় আপনি নিজে পোস্ট করবেন, আর কোন সেবায় অ্যাডমিনের সাথে যোগাযোগ করতে হবে, সব এক জায়গায় বুঝে নিন।"
      categoryBadge="সেবা গাইড"
      breadcrumbs={[{ label: 'কিভাবে কাজ করে' }]}
    >
      <div className="space-y-10 sm:space-y-14">
        {/* ১ — সেবা নিতে চান */}
        <section>
          <SectionHeading
            kicker="ধাপ ১"
            title="সেবা নিতে চান"
            text="যেকোনো সেবা নেওয়ার পুরো প্রক্রিয়া তিনটি ধাপে।"
          />
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TAKING_STEPS.map((item) => (
              <li
                key={item.step}
                className="flex h-full flex-col rounded-xl border border-brand-100/90 bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-accent-500">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-ink-900 sm:text-[15px]">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.text}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs leading-relaxed text-ink-700">
                      <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* ২ — নিজে পোস্ট করা যায় */}
        <section>
          <SectionHeading
            kicker="ধাপ ২"
            title="যেসব সেবায় আপনি নিজে পোস্ট করতে পারবেন"
            text="নিবন্ধন করে ফর্ম পূরণ করলেই বিজ্ঞাপন তৈরি হয়। অ্যাডমিন যাচাই করার পর সেটি সবার জন্য দেখা যায়।"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SELF_POST.map((item) =>
              item.name === 'রক্তদাতা' ? (
                <BloodDonorCard
                  key={item.name}
                  wide
                  mediaClassName="aspect-[21/9] sm:aspect-[16/9] lg:aspect-square"
                />
              ) : (
                <div
                  key={item.name}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-brand-100/90 bg-white"
                >
                  <div className="flex flex-1 flex-col p-5">
                    <span
                      className={`inline-flex items-center justify-center rounded-lg bg-brand-700 text-white ${
                        item.compact ? 'h-9 w-9' : 'h-11 w-11'
                      }`}
                    >
                      <item.icon className={item.compact ? 'h-4 w-4' : 'h-5 w-5'} />
                    </span>
                    <h3
                      className={`font-bold text-ink-900 ${
                        item.compact ? 'mt-2.5 text-[13px]' : 'mt-3.5 text-[15px]'
                      }`}
                    >
                      {item.name}
                    </h3>
                    <p
                      className={`leading-relaxed text-ink-500 ${
                        item.compact ? 'mt-1 text-[12px]' : 'mt-1.5 text-[13px]'
                      }`}
                    >
                      {item.text}
                    </p>
                    <ul className={`flex-1 space-y-1.5 ${item.compact ? 'mt-2.5' : 'mt-3'}`}>
                      {item.points.map((point) => (
                        <li
                          key={point}
                          className={`flex items-start gap-2 leading-relaxed text-ink-700 ${
                            item.compact ? 'text-[11px]' : 'text-xs'
                          }`}
                        >
                          <BadgeCheck
                            className={`shrink-0 text-brand-600 ${item.compact ? 'mt-0.5 h-3 w-3' : 'mt-0.5 h-3.5 w-3.5'}`}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={item.href}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 font-bold text-white transition-colors hover:bg-brand-800 ${
                        item.compact ? 'mt-3 min-h-[38px] px-3 py-2 text-xs' : 'mt-4 min-h-[44px] px-4 py-2.5 text-sm'
                      }`}
                    >
                      {item.cta}
                      <ArrowRight className={item.compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                    </Link>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* ৩ — অ্যাডমিন ম্যানেজড */}
        <section>
          <SectionHeading
            kicker="ধাপ ৩"
            title="যেসব সেবায় অ্যাডমিনের সাথে যোগাযোগ করতে হবে"
            text="এই সেবাগুলোর কর্মী ও প্রোফাইল অ্যাডমিন টিম যাচাই করে পরিচালনা করে, তাই এখানে নিজে পোস্ট করার সুযোগ নেই।"
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {ADMIN_MANAGED.map((item) => (
              <div
                key={item.name}
                className="flex h-full gap-4 rounded-xl border border-brand-100/90 bg-white p-5"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-400 text-brand-900">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-ink-900">{item.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800"
            >
              সেবা সমূহ দেখুন
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/profile/requests"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-700 px-6 py-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              আমার অনুরোধ দেখুন
            </Link>
          </div>
        </section>

        {/* ৪ — সরাসরি কল */}
        <section>
          <SectionHeading
            kicker="ধাপ ৪"
            title="জরুরি প্রয়োজনে সরাসরি কল"
            text="নিচের যেকোনো সেবায় ক্লিক করলে সরাসরি কল করার পেজে পৌঁছে যাবেন — সেখানেই সংশ্লিষ্ট নম্বরগুলো পাবেন।"
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HOTLINES.map((item) => (
              <Link
                key={item.name}
                href="/emergency-call"
                className="group flex min-h-[44px] flex-col items-center gap-2 rounded-xl border border-brand-100/90 bg-white p-4 text-center transition-colors hover:border-brand-700 hover:bg-brand-50"
              >
                <item.icon className="h-5 w-5 text-red-700" />
                <span className="text-xs font-semibold text-ink-700">{item.name}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                  কল করুন
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ৫ — তথ্যমূলক সেবা */}
        <section>
          <SectionHeading
            kicker="ধাপ ৫"
            title="তথ্যমূলক সেবা"
            text="এই ভাগগুলো এখন মূলত তথ্য ও নির্দেশনা দেয়। নিজে বিজ্ঞাপন দিতে চাইলে অ্যাডমিনের সাথে যোগাযোগ করুন — প্রয়োজন অনুযায়ী পোস্ট চালু করা হবে।"
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {INFO_SERVICES.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-xl border border-brand-100/90 bg-white p-4"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-semibold text-ink-800">{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* নিয়ম */}
        <section>
          <SectionHeading
            kicker="নিয়ম"
            title="সবার জন্য নিরাপত্তা ও গোপনীয়তা"
            text="প্ল্যাটফর্ম ব্যবহারের সময় যে তিনটি নিয়ম মানতে হবে।"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {RULES.map((item) => (
              <div
                key={item.title}
                className="flex h-full flex-col rounded-xl border border-brand-100/90 bg-white p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 text-sm font-bold text-ink-900">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* শেষ CTA */}
        <section className="rounded-2xl bg-brand-700 p-6 text-center sm:p-8">
          <h2 className="text-lg font-extrabold text-white sm:text-xl">এখনই শুরু করুন</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-50">
            প্রয়োজন অনুযায়ী সেবা বেছে নিন, অনুরোধ দিন, অথবা নিজের প্রোফাইল পোস্ট করে উপার্থিত হোন।
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-900 transition-colors hover:bg-brand-50 sm:w-auto"
            >
              সেবা সমূহ দেখুন
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 sm:w-auto"
            >
              অ্যাডমিনের সাথে যোগাযোগ
            </Link>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-50">
            <Info className="h-3.5 w-3.5" />
            জরুরি প্রয়োজনে ফোন নম্বর দেখতে চান?{' '}
            <Link href="/emergency-call" className="font-bold underline">
              জরুরি কল পেজে যান
            </Link>
          </p>
        </section>
      </div>
    </RoutePlaceholderShell>
  );
}
