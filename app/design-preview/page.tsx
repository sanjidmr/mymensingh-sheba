import type { Metadata } from 'next';
import DesignPreviewClient from '@/components/design-preview/DesignPreviewClient';

export const metadata: Metadata = {
  title: 'Design Preview',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignPreviewPage() {
  return <DesignPreviewClient />;
}
