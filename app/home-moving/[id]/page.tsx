import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [{ "id": '__app_dynamic__' }];
}

export default function HomeMovingPackageRedirect() {
  redirect('/home-moving');
}