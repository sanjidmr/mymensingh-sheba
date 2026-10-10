'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, ShieldCheck, Facebook, MessageCircle } from 'lucide-react';
import { LAUNCH_SERVICES } from '@/lib/services-data';
import { CONTACT_FORM_ANCHOR } from '@/lib/site-contact';
import {
  mergeSiteContact,
  mergeLaunchServices,
  type SiteContentOverrides,
} from '@/lib/site-content';

/**
 * The public footer.
 *
 * A Server Component so the admin's contact and service-catalog overrides are
 * applied before render. The contact block still honours the honesty rule in
 * `lib/site-contact.ts`: until a real number is published, the footer offers a
 * link to the contact form rather than a `tel:` link to a number that does not
 * exist.
 */
export default function Footer() {
  const currentYear = 2026;
  const [overrides, setOverrides] = useState<SiteContentOverrides>();

  useEffect(() => {
    let active = true;
    fetch('/api/site-content', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active && payload?.overrides) setOverrides(payload.overrides);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const contact = mergeSiteContact(overrides);
  const services = mergeLaunchServices(LAUNCH_SERVICES, overrides?.launch_services);

  const serviceLinks = services.filter(
    (s) =>
      [
        'tolet',
        'kajer-bua',
        'electrician',
        'plumber',
        'home-moving',
        'home-tutor',
        'blood-donor',
        'doctor',
        'police',
        'ambulance',
        'fire-service',
      ].includes(s.slug)
  );
  const serviceHref: Record<string, string> = {
    doctor: '/doctors',
    police: '/police',
    ambulance: '/ambulance',
    'fire-service': '/fireservice',
  };

  const companyLinks = [
    { name: 'ময়মনসিংহ পরিচিতি', href: '/mymensingh' },
    { name: 'আমাদের সম্পর্কে', href: '/about' },
    { name: 'কিভাবে কাজ করে', href: '/#how-it-works' },
    { name: 'যোগাযোগ ও ফিডব্যাক', href: '/contact' },
    { name: 'নিরাপত্তা নীতি', href: '/safety' },
  ];

  const supportLinks = [
    { name: 'সাহায্য ও জিজ্ঞাসা', href: '/help' },
    { name: 'প্রাইভেসি পলিসি', href: '/safety' },
    { name: 'ব্যবহারের শর্তাবলী', href: '/safety' },
    { name: 'ইউজার প্রোফাইল', href: '/profile' },
    { name: 'আমার রিকোয়েস্ট', href: '/profile/requests' },
  ];

  return (
    <footer className="border-t border-brand-900 bg-brand-950 text-brand-100/80">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-12 lg:gap-x-7">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10">
                <Image
                  src="/logo.png"
                  alt="Mymensingh Sheba লোগো"
                  width={230}
                  height={230}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Mymensingh Sheba
                </span>
                <span className="text-xs font-semibold text-brand-300">ময়মনসিংহ সেবা</span>
              </div>
            </Link>

            <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-brand-100/70">
              ময়মনসিংহ সিটি কর্পোরেশন এলাকার অধিবাসীদের জন্য একটি বিশ্বস্ত স্থানীয় সেবা প্ল্যাটফর্ম —
              বাসা ভাড়া, গৃহকর্মী, মেরামত, গৃহশিক্ষক ও জরুরি রক্তদান এক জায়গায়।
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-bronze-400/25 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-brand-100/90">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-bronze-300" />
              শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ডে সক্রিয়
            </div>

            <div className="mt-3 space-y-1.5 text-[13px]">
              {/* Reads from SITE_CONTACT so the footer can never advertise a
                  number that isn't published — the same rule the /contact page
                  follows. Previously this was a dead tel: link to an invented
                  number while /contact said none existed. */}
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-brand-100/70 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 text-brand-300" />
                  {contact.phone}
                </a>
              ) : (
                <Link href={`/contact#${CONTACT_FORM_ANCHOR}`} className="flex items-center gap-2.5 text-brand-100/70 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 text-brand-300" />
                  বার্তা পাঠান
                </Link>
              )}
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-brand-100/70 transition-colors hover:text-white">
                <Mail className="h-4 w-4 text-brand-300" />
                {contact.email}
              </a>
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              {contact.socials.length > 0 ? (
                contact.socials.map((social) =>
                  social.href ? (
                    <a
                      key={social.labelBn}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.labelBn}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-bronze-400/25 bg-white/[0.04] text-brand-100/80 transition-colors hover:border-bronze-400/60 hover:bg-brand-700 hover:text-white"
                    >
                      {social.icon === 'messenger' ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <Facebook className="h-4 w-4" />
                      )}
                    </a>
                  ) : (
                    <span
                      key={social.labelBn}
                      title="শীঘ্রই যুক্ত হবে"
                      aria-label={`${social.labelBn} — শীঘ্রই`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-bronze-400/25 text-brand-100/40"
                    >
                      {social.icon === 'messenger' ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <Facebook className="h-4 w-4" />
                      )}
                    </span>
                  )
                )
              ) : (
                <>
                  <span
                    title="শীঘ্রই যুক্ত হবে"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-bronze-400/25 text-brand-100/40"
                  >
                    <Facebook className="h-4 w-4" />
                  </span>
                  <span
                    title="শীঘ্রই যুক্ত হবে"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-bronze-400/25 text-brand-100/40"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </span>
                </>
              )}
            </div>
          </div>

          {/* সেবা */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">সেবা</h4>
            <ul className="mt-2.5 space-y-1.5 text-[13px]">
              {serviceLinks.map((s) => (
                <li key={s.id}>
                  <Link
                    href={serviceHref[s.slug] ?? `/${s.slug}`}
                    className="text-brand-100/70 transition-colors hover:text-white"
                  >
                    {s.nameBn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* কোম্পানি */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">কোম্পানি</h4>
            <ul className="mt-2.5 space-y-1.5 text-[13px]">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-brand-100/70 transition-colors hover:text-white">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* সহায়তা */}
          <div className="col-span-2 lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">সহায়তা ও অ্যাকাউন্ট</h4>
            <ul className="mt-2.5 space-y-1.5 text-[13px]">
              {supportLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-brand-100/70 transition-colors hover:text-white">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-brand-100/60 sm:flex-row">
          <p>© {currentYear} Mymensingh Sheba (ময়মনসিংহ সেবা)। সর্বস্বত্ব সংরক্ষিত।</p>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
            অ্যাডমিন-যাচাইকৃত স্থানীয় প্ল্যাটফর্ম
          </span>
        </div>
      </div>
    </footer>
  );
}