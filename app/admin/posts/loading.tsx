export default function PostsLoading() {
  return (
    <div aria-busy="true" aria-label="পোস্ট লোড হচ্ছে" className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-admin-border/60" />
        <div className="h-4 w-full max-w-lg rounded-md bg-admin-border/40" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-14 rounded-admin-card border border-admin-border bg-white" />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-11 rounded-md bg-admin-border/40" />
        ))}
      </div>
      <div className="overflow-hidden rounded-admin-card border border-admin-border bg-white">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-16 border-b border-admin-border last:border-0" />
        ))}
      </div>
    </div>
  );
}
