import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import ReviewListing from '@/components/home/ReviewListing';

export const metadata: Metadata = {
  title: 'ব্যবহারকারীদের রিভিউ',
  description: 'Mymensingh Sheba ব্যবহারকারীদের প্রকাশিত সব রিভিউ পড়ুন।',
};

export default function ReviewsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            আপনাদের অভিজ্ঞতা
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-ink-900 sm:text-3xl">
            ময়মনসিংহবাসীর সব রিভিউ
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
            Mymensingh Sheba ব্যবহারকারীদের প্রকাশিত অভিজ্ঞতা ও মতামত।
          </p>
          <ReviewListing />
        </div>
      </main>
      <Footer />
    </div>
  );
}
