import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutHero from '@/components/about/AboutHero';
import AboutStory from '@/components/about/AboutStory';
import FounderSection from '@/components/about/FounderSection';
import WhyUsSection from '@/components/about/WhyUsSection';
import MissionVisionSection from '@/components/about/MissionVisionSection';
import AboutHowItWorks from '@/components/about/AboutHowItWorks';
import AboutServices from '@/components/about/AboutServices';
import AboutValues from '@/components/about/AboutValues';
import AboutTrust from '@/components/about/AboutTrust';
import AboutCommitment from '@/components/about/AboutCommitment';
import AboutFinalCta from '@/components/about/AboutFinalCta';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে — Mymensingh Sheba',
  description:
    'ময়মনসিংহের মানুষের জন্য তৈরি Mymensingh Sheba — কেন তৈরি হয়েছে, কে তৈরি করেছেন, কীভাবে কাজ করে, কোন কোন সেবা পাওয়া যায় এবং কীভাবে নিজের সেবা পোস্ট করবেন।',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-mist-50">
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
            আমাদের সম্পর্কে
          </span>
        </nav>

        <AboutHero />
        <AboutStory />
        <FounderSection />
        <WhyUsSection />
        <MissionVisionSection />
        <AboutHowItWorks />
        <AboutServices />
        <AboutValues />
        <AboutTrust />
        <AboutCommitment />
        <AboutFinalCta />
      </main>

      <Footer />
    </div>
  );
}
