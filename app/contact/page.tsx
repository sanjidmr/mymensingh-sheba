import type { Metadata } from 'next';
import { Suspense } from 'react';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'যোগাযোগ করুন — Mymensingh Sheba',
  description:
    'Mymensingh Sheba-এর সাথে যোগাযোগ করুন — প্রশ্ন, পরামর্শ, সমস্যা বা সহযোগিতার জন্য। অনলাইনে বার্তা পাঠান, অথবা নিজের সেবা ময়মনসিংহের মানুষের কাছে পৌঁছে দিন।',
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageClient />
    </Suspense>
  );
}
