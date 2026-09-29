import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HomepageCategory } from '@/lib/homepage-catalog';
import CategoryHeader from '@/components/home/CategoryHeader';
import CategoryCard from '@/components/home/CategoryCard';

interface CategorySectionProps {
  category: HomepageCategory;
}

/**
 * CategorySection — one reusable shell for all three homepage categories.
 * Renders a refined centered category header, a clean desktop grid of equal
 * CategoryCards, and the "সব সেবা দেখুন" action at the very bottom of the
 * section. Sub-categories get visual rhythm through the section background
 * (`tone`: white → mist → deep forest) while the card system stays identical.
 */
export default function CategorySection({ category }: CategorySectionProps) {
  const dark = category.tone === 'dark';
  const bgClass =
    category.tone === 'mist'
      ? 'border-b border-brand-100/70 bg-mist-50'
      : category.tone === 'dark'
        ? 'bg-brand-600'
        : 'border-b border-brand-100/70 bg-white';

  return (
    <section className={bgClass} aria-label={category.title}>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <CategoryHeader
          title={category.title}
          description={category.description}
          dark={dark}
        />

        {/* One grid for every category: exactly three cards per row on phones,
            then the same rhythm the desktop already had from `sm` upwards. */}
        <div className={`mt-4 grid gap-2 sm:gap-4 ${category.grid ?? 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-3'}`}>
          {category.items.map((item, index) => (
            <div
              key={item.id}
              className={`${item.layoutClass ?? ''}${index >= 6 ? ' max-sm:hidden' : ''}`}
            >
              <CategoryCard
                item={item}
                compact={category.compact}
                dense={category.dense}
              />
            </div>
          ))}
        </div>

        {category.viewAll && (
          <div className="mt-5 flex justify-center">
            <Link
              href={category.viewAll.href}
              className={`group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-bold shadow-sm transition-all duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
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