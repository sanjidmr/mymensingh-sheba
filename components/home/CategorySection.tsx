import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HomepageCategory } from '@/lib/homepage-catalog';
import CategoryHeader from '@/components/home/CategoryHeader';
import CategoryTile from '@/components/home/CategoryTile';

interface CategorySectionProps {
  category: HomepageCategory;
}

/**
 * CategorySection — one reusable shell for all three homepage categories.
 * Renders a refined centered category header, a clean responsive grid of equal
 * CategoryTiles (photo + name, nothing else), and the "সব সেবা দেখুন" action at
 * the very bottom of the section. Sub-categories get visual rhythm through the
 * section background (`tone`: white → mist → deep forest) while the tile system
 * stays identical.
 */
export default function CategorySection({ category }: CategorySectionProps) {
  const dark = category.tone === 'dark';
  const total = category.items.length;
  const bgClass =
    category.tone === 'mist'
      ? 'border-b border-brand-100/70 bg-mist-50'
      : category.tone === 'dark'
        ? 'bg-brand-600'
        : 'border-b border-brand-100/70 bg-white';

  /**
   * Phones run FOUR tiles per row. A category whose last row holds a single
   * tile (5 services on a 4-up grid) would leave it stuck against the left
   * edge, so it is nudged into the middle column instead — the grid then reads
   * as deliberate rather than trailing off. Only ever applies to the phone
   * layout; from `sm` up the authored column counts decide.
   */
  const centreLastOnPhone = total % 4 === 1;

  return (
    <section className={bgClass} aria-label={category.title}>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <CategoryHeader
          title={category.title}
          description={category.description}
          dark={dark}
        />

        {/* Four compact tiles per row on phones (all four inside one row, no
            sideways overflow), then the same rhythm the desktop already had
            from `sm` upwards. Every service in the category is rendered —
            nothing is dropped on small screens. */}
        <div
          className={`mt-4 grid gap-x-2 gap-y-3 sm:mt-5 sm:gap-x-3 sm:gap-y-4 lg:gap-x-4 lg:gap-y-5 ${
            category.grid ?? 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-7'
          }`}
        >
          {category.items.map((item, index) => (
            <div
              key={item.id}
              className={`${item.layoutClass ?? ''}${
                centreLastOnPhone && index === total - 1 ? ' max-sm:col-start-2' : ''
              }`}
            >
              <CategoryTile item={item} />
            </div>
          ))}
        </div>

        {category.viewAll && (
          <div className="mt-4 flex justify-center">
            <Link
              href={category.viewAll.href}
              className={`group inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-5 py-2 text-[13px] font-bold shadow-sm transition-all duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                dark
                  ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                  : 'border-brand-200 bg-white text-brand-800 hover:border-bronze-300 hover:bg-mist-50'
              }`}
            >
              {category.viewAll.label}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}