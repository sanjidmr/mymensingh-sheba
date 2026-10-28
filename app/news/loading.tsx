import { formatLongBnDate } from '@/lib/news/news-utils';

/**
 * Server-render skeleton for the news front page. It mirrors the masthead and
 * lead geometry so the swap into real stories does not jump.
 */
export default function NewsLoading() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <div className="border-b border-[#ded9ce] bg-[#faf8f2]">
        <div className="mx-auto flex h-9 w-full max-w-[1180px] items-center px-4 text-[11px] text-[#8a857b] sm:px-6 lg:px-8">
          {formatLongBnDate(new Date())}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-[#0c3b2e]/80" />
          <div className="space-y-2">
            <div className="h-2 w-32 animate-pulse rounded bg-[#e8e4db]" />
            <div className="h-8 w-56 animate-pulse rounded bg-[#e8e4db] sm:h-10 sm:w-72" />
          </div>
        </div>
      </div>
      <div className="border-y border-[#ded9ce]">
        <div className="mx-auto flex h-11 w-full max-w-[1180px] items-center gap-5 overflow-hidden px-4 sm:px-6 lg:px-8">
          {[56, 64, 52, 56, 58, 60, 52, 64].map((width, index) => (
            <div
              key={index}
              className="h-2.5 shrink-0 animate-pulse rounded bg-[#e8e4db]"
              style={{ width }}
            />
          ))}
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1180px] gap-7 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-8 lg:border-r lg:border-[#ded9ce] lg:pr-7">
          <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="order-2 aspect-[4/3] animate-pulse bg-[#f2f0ea] sm:order-1" />
            <div className="order-1 space-y-3 sm:order-2">
              <div className="h-2.5 w-20 animate-pulse rounded bg-[#e8e4db]" />
              <div className="h-8 w-full animate-pulse rounded bg-[#e8e4db]" />
              <div className="h-8 w-4/5 animate-pulse rounded bg-[#e8e4db]" />
              <div className="h-3 w-full animate-pulse rounded bg-[#f2f0ea]" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-[#f2f0ea]" />
            </div>
          </div>
          <div className="mt-5 grid gap-5 border-t border-[#ded9ce] pt-5 sm:grid-cols-2">
            <div className="aspect-[16/9] animate-pulse bg-[#f2f0ea]" />
            <div className="aspect-[16/9] animate-pulse bg-[#f2f0ea]" />
          </div>
        </div>
        <div className="space-y-4 lg:col-span-4 lg:pl-7">
          <div className="h-5 w-24 animate-pulse rounded bg-[#e8e4db]" />
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-2 border-b border-[#e8e4db] pb-3">
              <div className="h-2.5 w-16 animate-pulse rounded bg-[#e8e4db]" />
              <div className="h-3.5 w-full animate-pulse rounded bg-[#f2f0ea]" />
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-[#f2f0ea]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
