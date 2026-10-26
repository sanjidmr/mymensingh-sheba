import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  ChevronRight,
  Droplets,
  FilePlus2,
  GraduationCap,
  Home,
  LogIn,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  UserRoundPlus,
  Wifi,
  Wrench,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SERVICE_STEPS = [
  {
    icon: UserRoundPlus,
    number: '০১',
    title: 'রেজিস্ট্রেশন বা লগইন করুন',
    text: 'অ্যাকাউন্ট তৈরি করুন, অথবা আপনার অ্যাকাউন্টে লগইন করে শুরু করুন।',
  },
  {
    icon: Search,
    number: '০২',
    title: 'আপনার প্রয়োজনীয় সেবা বেছে নিন',
    text: 'সেবা খুঁজুন পেজে যান, তালিকা দেখুন এবং আপনার প্রয়োজনের সঙ্গে মেলে এমন সেবাটি বেছে নিন।',
  },
  {
    icon: MessageCircle,
    number: '০৩',
    title: 'যোগাযোগ করুন অথবা অনুরোধ জানান',
    text: 'যোগাযোগের তথ্য থাকলে সরাসরি কল করুন। অনুরোধভিত্তিক সেবায় ফর্ম জমা দিন—প্রয়োজন অনুযায়ী অ্যাডমিন সহায়তা করবেন।',
  },
];

const SELF_SERVICE = [
  { icon: Home, title: 'বাসা ভাড়া', href: '/profile/tolet/new' },
  { icon: GraduationCap, title: 'গৃহশিক্ষক', href: '/profile/home-tutor/setup' },
  { icon: Droplets, title: 'রক্তদাতা', href: '/profile/blood-donor/setup' },
  { icon: Store, title: 'কোচিং', href: '/dashboard/coaching/new' },
  { icon: Wifi, title: 'WiFi', href: '/dashboard/wifi/new' },
  { icon: ShoppingBag, title: 'কেনাবেচা', href: '/buy-sell/create' },
  { icon: Briefcase, title: 'চাকরি', href: '/jobs/create' },
];

const ASSISTED_SERVICES = [
  { title: 'কাজের বুয়া', href: '/kajer-bua' },
  { title: 'ইলেকট্রিশিয়ান', href: '/electrician' },
  { title: 'প্লাম্বার', href: '/plumber' },
  { title: 'গাড়ি ভাড়া', href: '/gari-auto-cng' },
  { title: 'গৃহশিক্ষক', href: '/home-tutor' },
  { title: 'AC/ফ্রিজ মেরামত', href: '/ac-fridge' },
  { title: 'বাসা পাল্টানো', href: '/home-moving' },
];

const EMERGENCY_SERVICES = [
  { title: 'ডাক্তার', href: '/doctor' },
  { title: 'পুলিশ', href: '/police' },
  { title: 'ফায়ার সার্ভিস', href: '/fire-service' },
  { title: 'অ্যাম্বুলেন্স', href: '/ambulance' },
];

const POST_STEPS = [
  'রেজিস্ট্রেশন বা লগইন করুন',
  'উপরের “পোস্ট করুন” বাটনে ক্লিক করুন',
  '“পোস্ট করুন” নির্বাচন করে তথ্য প্রকাশ করুন',
];

const PROFILE_STEPS = [
  'রেজিস্ট্রেশন বা লগইন করুন',
  'প্রোফাইল অপশনে যান, অথবা উপরের “পোস্ট করুন” বাটনে ক্লিক করুন',
  '“সেবা প্রোফাইল খুলুন” নির্বাচন করে প্রয়োজনীয় তথ্য পূরণ করুন',
];

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-5 space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-800">
            {index + 1}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <Navbar />
      <main className="flex-1">
        <nav
          aria-label="ব্রেডক্রাম্ব"
          className="mx-auto flex w-full max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-ink-500 sm:px-6 sm:py-4 sm:text-sm lg:px-8"
        >
          <Link href="/" className="transition-colors hover:text-brand-800">হোম</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-300" aria-hidden="true" />
          <span aria-current="page" className="font-medium text-ink-700">কীভাবে কাজ করে</span>
        </nav>

        <section className="relative isolate overflow-hidden bg-brand-950 text-white">
          <div aria-hidden="true" className="absolute -right-24 -top-36 h-96 w-96 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
                ময়মনসিংহ সেবা · সহজ ব্যবহার নির্দেশিকা
              </p>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                আপনার প্রয়োজনের সেবা,
                <span className="block text-emerald-200">কয়েকটি সহজ ধাপে</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50/85 sm:text-base">
                সেবা খোঁজা থেকে সরাসরি যোগাযোগ, আবার নিজের তথ্য প্রকাশ—প্রতিটি কাজের পথ এখানে স্পষ্ট করে দেওয়া হয়েছে।
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 text-sm font-extrabold text-brand-950 transition-colors hover:bg-emerald-50 lg:self-end"
            >
              সেবা খুঁজুন <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl space-y-14 px-4 py-10 sm:px-6 sm:py-14 lg:space-y-20 lg:px-8">
          <section aria-labelledby="service-steps-heading">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">সেবা নিন নিশ্চিন্তে</p>
              <h2 id="service-steps-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                কীভাবে সেবা নেবেন?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-base">
                আপনার দরকারি সেবা বেছে নিয়ে নিজেই যোগাযোগ করুন, অথবা অনুরোধ পাঠিয়ে সহায়তা নিন।
              </p>
            </div>

            <ol className="mt-7 grid gap-4 md:grid-cols-3">
              {SERVICE_STEPS.map(({ icon: Icon, number, title, text }, index) => (
                <li key={number} className="relative rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
                  {index < SERVICE_STEPS.length - 1 && (
                    <div aria-hidden="true" className="absolute left-[4.25rem] right-[-1rem] top-10 hidden border-t border-dashed border-brand-200 md:block" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-3xl font-black tracking-tight text-brand-100">{number}</span>
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-ink-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                অনুরোধভিত্তিক সেবায় আপনার তথ্য জমা দিন; প্রয়োজন অনুযায়ী অ্যাডমিন টিম সহায়তা করবে।
              </p>
              <Link href="/login?next=%2Fservices" className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-bold text-brand-800 hover:text-brand-950">
                লগইন করুন <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="create-heading" className="rounded-3xl bg-mist-50 p-5 sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-700">আপনার তথ্য, আপনার হাতে</p>
              <h2 id="create-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                পোস্ট বা সেবা প্রোফাইল খুলুন
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-base">
                অ্যাকাউন্টে লগইন করে নতুন পোস্ট প্রকাশ করুন, অথবা আপনার সেবার জন্য একটি প্রোফাইল তৈরি করুন।
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <FilePlus2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-ink-900">পোস্ট করতে চাইলে</h3>
                    <p className="text-xs text-ink-500">তথ্য বা বিজ্ঞাপন প্রকাশ করুন</p>
                  </div>
                </div>
                <NumberedSteps steps={POST_STEPS} />
                <Link href="/dashboard/new" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-bold text-white hover:bg-brand-950">
                  পোস্ট তৈরি করুন <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>

              <article className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-ink-900">সেবা প্রোফাইল খুলতে চাইলে</h3>
                    <p className="text-xs text-ink-500">আপনার সেবার তথ্য যোগ করুন</p>
                  </div>
                </div>
                <NumberedSteps steps={PROFILE_STEPS} />
                <Link href="/dashboard/profiles" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-sm font-bold text-brand-900 hover:bg-brand-50">
                  সেবা প্রোফাইল খুলুন <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
              <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
              পোস্ট বা সেবা প্রোফাইল তৈরি করতে লগইন প্রয়োজন। অ্যাকাউন্ট না থাকলে আগে রেজিস্ট্রেশন করুন।
              <Link href="/register" className="shrink-0 font-bold text-brand-800 underline underline-offset-2">রেজিস্ট্রেশন</Link>
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-ink-900">নিজে তথ্য বা প্রোফাইল যোগ করুন</h2>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {SELF_SERVICE.map(({ icon: Icon, title, href }) => (
                <Link
                  key={title}
                  href={href}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-xs font-bold text-ink-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span className="truncate">{title}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="সেবা খোঁজার ধরন">
            <div className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand-700" aria-hidden="true" />
                <h2 className="text-base font-extrabold text-ink-900">অনুরোধভিত্তিক সেবা</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">তালিকা দেখে সেবা বেছে নিন, তারপর প্রয়োজন জানিয়ে অনুরোধ পাঠান।</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ASSISTED_SERVICES.map((item) => (
                  <Link key={item.title} href={item.href} className="rounded-full border border-brand-100 bg-mist-50 px-3 py-2 text-xs font-semibold text-brand-900 transition-colors hover:border-brand-300 hover:bg-brand-50">
                    {item.title}
                  </Link>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-2 border-t border-brand-100 pt-3 text-xs leading-relaxed text-ink-600">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                এ ছাড়া অন্য কোনো প্রয়োজনে <Link href="/contact" className="font-bold text-brand-800 underline underline-offset-2">অ্যাডমিনের সঙ্গে যোগাযোগ করুন</Link>।
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-700" aria-hidden="true" />
                <h2 className="text-base font-extrabold text-ink-900">জরুরি সেবা</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">জরুরি যোগাযোগের নম্বর ও তথ্য দেখতে সংশ্লিষ্ট পেজে যান।</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {EMERGENCY_SERVICES.map((item) => (
                  <Link key={item.title} href={item.href} className="rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900 transition-colors hover:bg-red-100">
                    {item.title}
                  </Link>
                ))}
              </div>
              <p className="mt-5 flex items-start gap-2 border-t border-red-100 pt-3 text-xs leading-relaxed text-ink-600">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
                তথ্য দেখার আগে জরুরি পরিস্থিতির উপযোগী সেবা নির্বাচন করুন।
              </p>
            </div>
          </section>

          <p className="flex items-start gap-2 rounded-2xl border border-brand-100 bg-mist-50 p-4 text-xs leading-relaxed text-ink-600 sm:text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            পাবলিক তালিকা লগইন ছাড়াই দেখা যায়। ব্যক্তিগত যোগাযোগের তথ্য, অনুরোধ পাঠানো এবং পোস্ট বা সেবা প্রোফাইল তৈরি করতে লগইন প্রয়োজন।
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
