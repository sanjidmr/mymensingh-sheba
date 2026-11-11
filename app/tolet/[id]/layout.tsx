import { getPublicToletStaticParams } from '@/lib/static-route-params';

export async function generateStaticParams() {
  return getPublicToletStaticParams();
}

export default function DynamicRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
