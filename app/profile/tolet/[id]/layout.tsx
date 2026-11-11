export function generateStaticParams() {
  return [{ "id": '__app_dynamic__' }];
}

export default function DynamicRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
