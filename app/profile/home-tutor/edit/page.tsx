'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeTutorEditPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/home-tutor/setup');
  }, [router]);

  return null;
}