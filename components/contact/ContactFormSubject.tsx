'use client';

import { useSearchParams } from 'next/navigation';
import ContactForm from './ContactForm';
import type { ContactSubject } from '@/lib/contact-types';

export default function ContactFormSubject({
  initialSubject,
}: {
  initialSubject?: ContactSubject | '';
}) {
  const searchParams = useSearchParams();
  const querySubject = searchParams.get('subject');
  const subject =
    initialSubject !== undefined
      ? initialSubject
      : querySubject === 'news_submission'
        ? querySubject
        : '';

  return <ContactForm key={subject} initialSubject={subject} />;
}
