import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [{ "slug": '__app_dynamic__' }];
}

export default function BusDetailPage() {
  redirect('/services');
}
