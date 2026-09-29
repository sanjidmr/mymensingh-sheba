import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactHero from '@/components/contact/ContactHero';
import ContactComposer from '@/components/contact/ContactComposer';
import ContactPostCta from '@/components/contact/ContactPostCta';
import ContactFaq from '@/components/contact/ContactFaq';
import ContactLocation from '@/components/contact/ContactLocation';
import ContactClosing from '@/components/contact/ContactClosing';

export const metadata: Metadata = {
  title: 'যোগাযোগ করুন — Mymensingh Sheba',
  description:
    'Mymensingh Sheba-এর সাথে যোগাযোগ করুন — প্রশ্ন, পরামর্শ, সমস্যা বা সহযোগিতার জন্য। অনলাইনে বার্তা পাঠান, অথবা নিজের সেবা ময়মনসিংহের মানুষের কাছে পৌঁছে দিন।',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />

      <main className="flex-1">
        <nav
          aria-label="ব্রেডক্রাম্ব"
          className="mx-auto flex w-full max-w-7xl items-center gap-1.5 px-4 pt-4 text-xs text-ink-500 sm:px-6 sm:pt-6 sm:text-sm lg:px-8"
        >
          <Link href="/" className="transition-colors hover:text-brand-800">
            হোম
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-300" aria-hidden="true" />
          <span aria-current="page" className="font-medium text-ink-700">
            যোগাযোগ
          </span>
        </nav>

        <ContactHero />
        <ContactComposer />
        <ContactPostCta />
        <ContactFaq />
        <ContactLocation />
        <ContactClosing />
      </main>

      <Footer />
    </div>
  );
}
