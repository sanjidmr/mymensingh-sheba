import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Droplets,
  GraduationCap,
  Home,
  Phone,
  Search,
  ShoppingBag,
  ShieldCheck,
  Store,
  Wifi,
  Wrench,
} from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';

const STEPS = [
  { icon: Search, title: 'সেবা খুঁজুন', text: 'তালিকা দেখুন, সার্চ ও ফিল্টার ব্যবহার করুন।' },
  { icon: ShieldCheck, title: 'লগইন করে অনুরোধ দিন', text: 'প্রয়োজনীয় ফর্ম পূরণ করুন বা যোগাযোগের তথ্য দেখুন।' },
  { icon: BadgeCheck, title: 'অনুরোধ অনুসরণ করুন', text: 'ড্যাশবোর্ডে অনুরোধের অগ্রগতি দেখুন।' },
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
];

const EMERGENCY_SERVICES = [
  { title: 'ডাক্তার', href: '/doctor' },
  { title: 'পুলিশ', href: '/police' },
  { title: 'ফায়ার সার্ভিস', href: '/fire-service' },
  { title: 'অ্যাম্বুলেন্স', href: '/ambulance' },
];

export default function HowItWorksPage() {
  return (
    <RoutePlaceholderShell
      title="কীভাবে কাজ করে"
      subtitle="সেবা খোঁজা, অনুরোধ পাঠানো এবং জরুরি যোগাযোগের সহজ নির্দেশনা।"
      categoryBadge="সেবা গাইড"
      breadcrumbs={[{ label: 'কীভাবে কাজ করে' }]}
      compact
    >
      <div className="space-y-6">
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-xl border border-brand-100 bg-white p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[11px] font-bold text-brand-600">ধাপ {index + 1}</p>
              <h2 className="mt-0.5 text-sm font-extrabold text-ink-900">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">{text}</p>
            </li>
          ))}
        </ol>

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

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <h2 className="text-sm font-extrabold text-ink-900">অনুরোধভিত্তিক সেবা</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500">তালিকা দেখে লগইন করে অনুরোধ পাঠান।</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ASSISTED_SERVICES.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-md bg-mist-50 px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-rose-700" aria-hidden="true" />
              <h2 className="text-sm font-extrabold text-ink-900">জরুরি সেবা</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500">জরুরি নম্বর দেখতে সংশ্লিষ্ট পেজে যান।</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMERGENCY_SERVICES.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <p className="flex items-start gap-2 rounded-xl border border-brand-100 bg-mist-50 p-3 text-xs leading-relaxed text-ink-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          পাবলিক তালিকা লগইন ছাড়াই দেখা যায়। ব্যক্তিগত যোগাযোগের তথ্য ও অনুরোধের সুবিধার জন্য লগইন প্রয়োজন।
        </p>
      </div>
    </RoutePlaceholderShell>
  );
}
