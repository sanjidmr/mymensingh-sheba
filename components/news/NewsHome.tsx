import Link from 'next/link';
import { ArrowRight, ChevronRight, PenLine } from 'lucide-react';
import { NEWS_CATEGORIES, toBn } from '@/lib/catalog-types';
import {
  deskHref,
  deskLabel,
  filterNews,
  formatNewsTimestamp,
  groupByDesk,
  homepageDeskSections,
  pickLead,
  searchItems as toSearchItems,
  sortNewestFirst,
  type NewsGroup,
  type NewsStory,
} from '@/lib/news/news-utils';
import NewsMasthead from './NewsMasthead';
import NewsImage from './NewsImage';

const CONTAINER = 'mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8';
const HAIRLINE = 'border-[#ded9ce]';
const MUTED = 'text-[#6d685f]';
const SERIF = 'font-[family-name:var(--font-news-serif)]';

type NewsHomeProps = {
  stories: NewsStory[];
  failed: boolean;
  now: number;
  todayLabel: string;
  selectedCategory?: string;
  query?: string;
};

export default function NewsHome({
  stories,
  failed,
  now,
  todayLabel,
  selectedCategory,
  query,
}: NewsHomeProps) {
  const ordered = sortNewestFirst(stories);
  const searchable = toSearchItems(ordered, now);
  const category = selectedCategory?.trim() || '';
  const searchQuery = query?.trim() || '';
  const isFilteredView = Boolean(category || searchQuery);
  const filtered = filterNews(ordered, { category, query: searchQuery });

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#141414]">
      <NewsMasthead
        todayLabel={todayLabel}
        searchItems={searchable}
        activeCategory={category || undefined}
      />

      <main className={CONTAINER}>
        {failed ? (
          <LoadFailure />
        ) : ordered.length === 0 ? (
          <EmptyNewsroom />
        ) : isFilteredView ? (
          <FilteredView
            stories={filtered}
            now={now}
            category={category}
            query={searchQuery}
          />
        ) : (
          <FrontPage stories={ordered} now={now} />
        )}
      </main>

      <NewsFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Front page
// ---------------------------------------------------------------------------

function FrontPage({ stories, now }: { stories: NewsStory[]; now: number }) {
  const lead = pickLead(stories);
  const ordered = sortNewestFirst(stories);
  const secondary = lead ? ordered.filter((story) => story.id !== lead.id).slice(0, 2) : [];
  /*
    The front page never prints the same story twice in two large blocks. The
    hero already carries the lead and its two companions, so the sections below
    are built from the remaining stories. On a young newsroom with three
    published stories that means the page ends after the hero — an honest front
    page rather than three shells of the same three headlines.
  */
  const heroIds = new Set(
    [lead, ...secondary].filter((story): story is NewsStory => Boolean(story)).map((story) => story.id)
  );
  const rest = ordered.filter((story) => !heroIds.has(story.id));
  const latest = rest.slice(0, 8);
  const sections = homepageDeskSections(rest);
  const sectionIds = new Set(sections.map((section) => section.id));
  const leftovers = rest.filter(
    (story) => !sectionIds.has(story.category?.trim() || 'others')
  );
  const desks = groupByDesk(ordered);

  return (
    <>
      {lead ? (
        <section aria-labelledby="lead-heading" className="pt-5 sm:pt-7">
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8 lg:border-r lg:border-[#ded9ce] lg:pr-7">
              <LeadStory story={lead} now={now} />

              {secondary.length > 0 && (
                <div className="mt-5 grid gap-5 border-t border-[#141414]/20 pt-5 sm:grid-cols-2 sm:gap-6">
                  {secondary.map((story) => (
                    <SecondaryStory key={story.id} story={story} now={now} />
                  ))}
                </div>
              )}
            </div>

            <aside aria-label="সর্বশেষ সংবাদ" className="mt-6 min-w-0 lg:col-span-4 lg:mt-0 lg:pl-7">
              <SectionRule title="সর্বশেষ" href="/news" linkLabel="সব সংবাদ" />
              <ol className="divide-y divide-[#e8e4db]">
                {ordered.slice(0, 4).map((story) => (
                  <LatestRailRow key={story.id} story={story} now={now} />
                ))}
              </ol>
              <SendNewsBox />
            </aside>
          </div>
        </section>
      ) : null}

      {latest.length > 0 && (
        <section aria-labelledby="latest-heading" className="mt-8 border-t border-[#141414]/20 pt-6 sm:mt-10">
          <div className="flex items-end justify-between gap-3 border-b-2 border-[#141414] pb-2">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#0c3b2e]">
                প্রকাশের সময় অনুযায়ী
              </p>
              <h2 id="latest-heading" className={`${SERIF} mt-1 text-[22px] font-black leading-none sm:text-[26px]`}>
                সর্বশেষ সংবাদ
              </h2>
            </div>
            <Link
              href="/news"
              className="inline-flex shrink-0 items-center gap-1 pb-0.5 text-[11.5px] font-bold text-[#0c3b2e] hover:text-[#0a3227]"
            >
              সব সংবাদ
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-1 grid gap-x-8 lg:grid-cols-2">
            {latest.map((story) => (
              <LatestRow key={story.id} story={story} now={now} />
            ))}
          </div>
        </section>
      )}

      {sections.map((section, index) => (
        <DeskSection
          key={section.id}
          section={section}
          now={now}
          leadId={lead?.id}
          variant={index % 2 === 0 ? 'feature-left' : 'feature-right'}
        />
      ))}

      {leftovers.length > 0 && (
        <section aria-labelledby="more-news-heading" className="mt-8 border-t border-[#141414]/20 pt-6 sm:mt-10">
          <div className="flex items-end justify-between gap-3 border-b-2 border-[#141414] pb-2">
            <h2 id="more-news-heading" className={`${SERIF} text-[22px] font-black leading-none sm:text-[26px]`}>
              আরও সংবাদ
            </h2>
            <Link
              href="/news"
              className="inline-flex shrink-0 items-center gap-1 pb-0.5 text-[11.5px] font-bold text-[#0c3b2e] hover:text-[#0a3227]"
            >
              সব সংবাদ
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leftovers.slice(0, 6).map((story) => (
              <WideStoryRow key={story.id} story={story} now={now} />
            ))}
          </div>
        </section>
      )}

      <section
        className={`mt-8 grid gap-7 border-t border-[#141414]/20 pt-6 sm:mt-10 ${
          ordered.length >= 5 ? 'lg:grid-cols-12' : ''
        }`}
      >
        {ordered.length >= 5 && (
          <div className="min-w-0 lg:col-span-7">
            <SectionRule title="সাম্প্রতিক পাঠ" href="/news" linkLabel="সব সংবাদ" />
            <p className={`${MUTED} mt-2 text-[11.5px]`}>
              পাঠকের আগ্রহের কোনো অনুমান নয় — প্রকাশের সময় অনুযায়ী সাম্প্রতিক সংবাদ।
            </p>
            <ol className="mt-2 divide-y divide-[#e8e4db]">
              {ordered.slice(0, 5).map((story, index) => (
                <RecentNumberRow key={story.id} story={story} now={now} index={index} />
              ))}
            </ol>
          </div>
        )}

        <div className={`min-w-0 ${ordered.length >= 5 ? 'lg:col-span-5' : ''}`}>
          <SectionRule title="সংবাদ বিভাগ" />
          <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {desks.map((desk) => (
              <Link
                key={desk.id}
                href={deskHref(desk.id)}
                className={`flex items-center justify-between gap-2 border-b ${HAIRLINE} py-2.5 text-[12.5px] font-semibold text-[#38352f] transition-colors hover:text-[#0c3b2e]`}
              >
                <span className="truncate">{desk.label}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-[#8a857b]">
                  {toBn(desk.stories.length)}
                </span>
              </Link>
            ))}
            <Link
              href="/news"
              className={`flex items-center justify-between gap-2 border-b ${HAIRLINE} py-2.5 text-[12.5px] font-bold text-[#0c3b2e] sm:col-span-2`}
            >
              সব বিভাগ দেখুন
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <p className={`${MUTED} mt-4 text-[11px] leading-relaxed`}>
            বিভাগের সংখ্যা এখানে প্রকাশিত সংবাদ অনুযায়ী দেখানো হয়েছে।
          </p>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Filtered view (desk or search results)
// ---------------------------------------------------------------------------

function FilteredView({
  stories,
  now,
  category,
  query,
}: {
  stories: NewsStory[];
  now: number;
  category: string;
  query: string;
}) {
  const heading = query
    ? `“${query}” এর ফলাফল`
    : `${deskLabel(category)} বিভাগের সংবাদ`;
  const ordered = sortNewestFirst(stories);
  const lead = pickLead(ordered);
  const rest = lead ? ordered.filter((story) => story.id !== lead.id) : [];

  return (
    <section className="pt-6 sm:pt-8">
      <div className="border-b-2 border-[#141414] pb-3">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#0c3b2e]">
          {query ? 'অনুসন্ধান' : 'বিভাগ'}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h1 className={`${SERIF} text-[24px] font-black leading-tight sm:text-[32px]`}>{heading}</h1>
          <p className={`${MUTED} pb-1 text-[11.5px]`}>
            {toBn(ordered.length)}টি প্রকাশিত সংবাদ
          </p>
        </div>
      </div>

      {!lead ? (
        <div className="my-10 border border-[#ded9ce] bg-[#fbfaf7] px-5 py-10 text-center">
          <h2 className={`${SERIF} text-xl font-black`}>
            {query ? 'এই শব্দে কোনো সংবাদ পাওয়া যায়নি' : 'এই বিভাগে এখনো কোনো সংবাদ প্রকাশিত হয়নি'}
          </h2>
          <p className={`${MUTED} mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed`}>
            {query
              ? 'অন্য কোনো শব্দ দিয়ে খুঁজুন, অথবা সাম্প্রতিক সংবাদ দেখুন।'
              : 'মডারেটর অনুমোদনের পর এই বিভাগের সংবাদ এখানে দেখা যাবে।'}
          </p>
          <Link
            href="/news"
            className="mt-4 inline-flex h-10 items-center justify-center bg-[#0c3b2e] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#0a3227]"
          >
            সব সংবাদ দেখুন
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-7 lg:grid-cols-12">
          <article className="min-w-0 lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr] sm:items-start">
              <div className="order-2 aspect-[16/10] overflow-hidden bg-[#f2f0ea] sm:order-1 sm:aspect-[4/3]">
                <NewsImage
                  src={lead.coverImageUrl}
                  alt={lead.titleBn}
                  eager
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="order-1 min-w-0 sm:order-2">
                <CategoryKicker story={lead} />
                <h2 className={`${SERIF} mt-2 text-[24px] font-black leading-[1.2] text-[#141414] sm:text-[30px]`}>
                  <Link href={`/news/${lead.slug}`} className="hover:text-[#0c3b2e]">
                    {lead.titleBn}
                  </Link>
                </h2>
                {lead.summaryBn && (
                  <p className="mt-2.5 line-clamp-4 text-[13.5px] leading-relaxed text-[#555148] sm:text-[14.5px]">
                    {lead.summaryBn}
                  </p>
                )}
                <StoryMeta story={lead} now={now} />
              </div>
            </div>
          </article>

          <div className="min-w-0 border-t border-[#141414]/20 pt-3 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#0c3b2e]">
              এই বিভাগের আরও সংবাদ
            </p>
            <div className="mt-1 divide-y divide-[#e8e4db]">
              {rest.length > 0 ? (
                rest.map((story) => <LatestRow key={story.id} story={story} now={now} />)
              ) : (
                <p className={`${MUTED} py-5 text-[12.5px] leading-relaxed`}>
                  এই বিভাগে এখন কেবল একটি সংবাদ প্রকাশিত আছে।
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Story pieces
// ---------------------------------------------------------------------------

function LeadStory({ story, now }: { story: NewsStory; now: number }) {
  return (
    <article className="min-w-0">
      <div
        className={`grid gap-4 ${
          story.coverImageUrl ? 'sm:grid-cols-[1.1fr_0.9fr] sm:items-start' : ''
        }`}
      >
        {story.coverImageUrl && (
          <div className="order-2 aspect-[16/10] overflow-hidden bg-[#f2f0ea] sm:order-1 sm:aspect-[4/3]">
            <NewsImage
              src={story.coverImageUrl}
              alt={story.titleBn}
              eager
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="order-1 min-w-0 sm:order-2">
          <CategoryKicker story={story} />
          <h1
            id="lead-heading"
            className={`${SERIF} mt-2 text-[27px] font-black leading-[1.17] tracking-[-0.01em] text-[#141414] sm:text-[32px] lg:text-[36px]`}
          >
            <Link href={`/news/${story.slug}`} className="transition-colors hover:text-[#0c3b2e]">
              {story.titleBn}
            </Link>
          </h1>
          {story.summaryBn && (
            <p className="mt-2.5 line-clamp-4 text-[13.5px] leading-[1.7] text-[#555148] sm:line-clamp-5 sm:text-[14.5px]">
              {story.summaryBn}
            </p>
          )}
          <StoryMeta story={story} now={now} />
          <Link
            href={`/news/${story.slug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#0c3b2e] transition-colors hover:text-[#0a3227]"
          >
            পুরো প্রতিবেদন পড়ুন
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SecondaryStory({ story, now }: { story: NewsStory; now: number }) {
  return (
    <article className="group min-w-0">
      {story.coverImageUrl && (
        <Link href={`/news/${story.slug}`} className="block aspect-[16/9] overflow-hidden bg-[#f2f0ea]">
          <NewsImage
            src={story.coverImageUrl}
            alt={story.titleBn}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </Link>
      )}
      <div className="mt-2.5">
        <CategoryKicker story={story} />
        <h3 className={`${SERIF} mt-1.5 text-[18px] font-black leading-[1.25] sm:text-[19px]`}>
          <Link href={`/news/${story.slug}`} className="transition-colors group-hover:text-[#0c3b2e]">
            {story.titleBn}
          </Link>
        </h3>
        {story.summaryBn && (
          <p className={`${MUTED} mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed`}>
            {story.summaryBn}
          </p>
        )}
        <StoryMeta story={story} now={now} compact />
      </div>
    </article>
  );
}

function DeskSection({
  section,
  now,
  leadId,
  variant,
}: {
  section: NewsGroup;
  now: number;
  leadId?: string;
  variant: 'feature-left' | 'feature-right';
}) {
  const feature =
    section.stories.find((story) => story.id !== leadId) ?? section.stories[0];
  const rest = feature
    ? section.stories.filter((story) => story.id !== feature.id).slice(0, 4)
    : [];

  if (!feature) return null;

  return (
    <section
      aria-labelledby={`desk-${section.id}`}
      className="mt-8 border-t border-[#141414]/20 pt-6 sm:mt-10"
    >
      <div className="flex items-end justify-between gap-3 border-b-2 border-[#141414] pb-2">
        <h2 id={`desk-${section.id}`} className={`${SERIF} text-[22px] font-black leading-none sm:text-[26px]`}>
          {section.label}
        </h2>
        <Link
          href={deskHref(section.id)}
          className="inline-flex shrink-0 items-center gap-1 pb-0.5 text-[11.5px] font-bold text-[#0c3b2e] hover:text-[#0a3227]"
        >
          আরও
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:gap-7">
        <article
          className={`min-w-0 lg:col-span-7 ${
            variant === 'feature-right' ? 'lg:order-2' : ''
          }`}
        >
          {feature.coverImageUrl && (
            <Link
              href={`/news/${feature.slug}`}
              className="block aspect-[16/9] overflow-hidden bg-[#f2f0ea]"
            >
              <NewsImage
                src={feature.coverImageUrl}
                alt={feature.titleBn}
                className="h-full w-full object-cover"
              />
            </Link>
          )}
          <div className="mt-2.5">
            <CategoryKicker story={feature} />
            <h3 className={`${SERIF} mt-1.5 text-[21px] font-black leading-[1.22] sm:text-[24px]`}>
              <Link href={`/news/${feature.slug}`} className="transition-colors hover:text-[#0c3b2e]">
                {feature.titleBn}
              </Link>
            </h3>
            {feature.summaryBn && (
              <p className={`${MUTED} mt-2 line-clamp-3 text-[13px] leading-[1.65]`}>
                {feature.summaryBn}
              </p>
            )}
            <StoryMeta story={feature} now={now} compact />
          </div>
        </article>

        <div
          className={`min-w-0 border-t border-[#ded9ce] pt-1 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0 ${
            variant === 'feature-right' ? 'lg:order-1' : ''
          }`}
        >
          {rest.map((story) => (
            <CompactDeskRow key={story.id} story={story} now={now} />
          ))}
          {rest.length === 0 && (
            <Link
              href={`/news/${feature.slug}`}
              className="flex items-center justify-between gap-3 border-b border-[#ded9ce] py-4 text-[12.5px] font-bold text-[#0c3b2e]"
            >
              এই বিভাগের প্রতিবেদনটি পড়ুন
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function LatestRailRow({ story, now }: { story: NewsStory; now: number }) {
  const time = formatNewsTimestamp(story.publishedAt || story.createdAt, now);
  return (
    <li className="py-3 first:pt-2.5">
      <Link href={`/news/${story.slug}`} className="group flex items-start gap-3">
        <span className="w-[58px] shrink-0 pt-0.5 text-[10px] font-semibold leading-snug text-[#0c3b2e]">
          {time.relative ?? 'সংবাদ'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold leading-[1.4] text-[#242424] group-hover:text-[#0c3b2e]">
            {story.titleBn}
          </span>
          <span className="mt-1 block text-[10.5px] text-[#8a857b]">{deskLabel(story.category)}</span>
        </span>
      </Link>
    </li>
  );
}

function LatestRow({ story, now }: { story: NewsStory; now: number }) {
  const time = formatNewsTimestamp(story.publishedAt || story.createdAt, now);
  return (
    <Link
      href={`/news/${story.slug}`}
      className="group flex min-w-0 gap-3 border-b border-[#e8e4db] py-3.5 transition-colors hover:bg-[#faf8f2] sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
          <span className="font-bold text-[#0c3b2e]">{deskLabel(story.category)}</span>
          <span aria-hidden="true" className="text-[#c2bcb0]">•</span>
          <time dateTime={story.publishedAt || story.createdAt} className="text-[#8a857b]" title={time.exact}>
            {time.relative}
          </time>
        </div>
        <h3 className="mt-1 text-[14.5px] font-bold leading-[1.42] text-[#1d1d1d] group-hover:text-[#0c3b2e] sm:text-[15.5px]">
          {story.titleBn}
        </h3>
        {story.summaryBn && (
          <p className={`${MUTED} mt-1 line-clamp-2 text-[11.5px] leading-relaxed`}>
            {story.summaryBn}
          </p>
        )}
      </div>
      {story.coverImageUrl && (
        <div className="h-[58px] w-[78px] shrink-0 overflow-hidden bg-[#f2f0ea] sm:h-[64px] sm:w-[96px]">
          <NewsImage
            src={story.coverImageUrl}
            alt={story.titleBn}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </Link>
  );
}

function CompactDeskRow({ story, now }: { story: NewsStory; now: number }) {
  const time = formatNewsTimestamp(story.publishedAt || story.createdAt, now);
  return (
    <Link
      href={`/news/${story.slug}`}
      className="group flex min-w-0 gap-3 border-b border-[#e8e4db] py-3.5 first:pt-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[9.5px] font-bold text-[#0c3b2e]">{deskLabel(story.category)}</p>
        <h4 className="mt-1 text-[13.5px] font-bold leading-[1.4] text-[#242424] group-hover:text-[#0c3b2e]">
          {story.titleBn}
        </h4>
        <p className="mt-1 text-[10px] text-[#8a857b]">{time.relative}</p>
      </div>
      {story.coverImageUrl && (
        <div className="h-14 w-[70px] shrink-0 overflow-hidden bg-[#f2f0ea]">
          <NewsImage src={story.coverImageUrl} alt={story.titleBn} className="h-full w-full object-cover" />
        </div>
      )}
    </Link>
  );
}

function WideStoryRow({ story, now }: { story: NewsStory; now: number }) {
  return (
    <Link
      href={`/news/${story.slug}`}
      className="group flex min-w-0 gap-3 border-b border-[#e8e4db] pb-3"
    >
      {story.coverImageUrl && (
        <div className="h-16 w-24 shrink-0 overflow-hidden bg-[#f2f0ea]">
          <NewsImage src={story.coverImageUrl} alt={story.titleBn} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <CategoryKicker story={story} />
        <h3 className="mt-1 line-clamp-3 text-[13.5px] font-bold leading-[1.4] text-[#242424] group-hover:text-[#0c3b2e]">
          {story.titleBn}
        </h3>
        <StoryMeta story={story} now={now} compact />
      </div>
    </Link>
  );
}

function RecentNumberRow({
  story,
  now,
  index,
}: {
  story: NewsStory;
  now: number;
  index: number;
}) {
  const time = formatNewsTimestamp(story.publishedAt || story.createdAt, now);
  return (
    <li>
      <Link href={`/news/${story.slug}`} className="group flex min-w-0 items-start gap-3 py-3">
        <span className="w-8 shrink-0 text-[20px] font-black leading-none text-[#c9c3b7]">
          {toBn(String(index + 1).padStart(2, '0'))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-[1.4] text-[#242424] group-hover:text-[#0c3b2e]">
            {story.titleBn}
          </span>
          <span className="mt-1 block text-[10px] text-[#8a857b]">
            {deskLabel(story.category)} · {time.relative}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CategoryKicker({ story }: { story: NewsStory }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#0c3b2e]">
      <Link href={deskHref(story.category)} className="hover:text-[#0a3227]">
        {deskLabel(story.category)}
      </Link>
      {story.isFeatured && (
        <>
          <span aria-hidden="true" className="text-[#c2bcb0]">•</span>
          <span className="text-[#8a6b2f]">নির্বাচিত</span>
        </>
      )}
    </p>
  );
}

function StoryMeta({
  story,
  now,
  compact = false,
}: {
  story: NewsStory;
  now: number;
  compact?: boolean;
}) {
  const time = formatNewsTimestamp(story.publishedAt || story.createdAt, now);
  return (
    <div
      className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#8a857b] ${
        compact ? 'mt-1.5' : ''
      }`}
    >
      <span className="font-semibold text-[#5f5a51]">
        {story.authorName?.trim() || 'সংবাদ ডেস্ক'}
      </span>
      <span aria-hidden="true" className="text-[#c2bcb0]">•</span>
      <time dateTime={story.publishedAt || story.createdAt}>{time.exact}</time>
    </div>
  );
}

function SectionRule({
  title,
  href,
  linkLabel = 'সব দেখুন',
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-2 border-b-2 border-[#141414] pb-2">
      <h2 className={`${SERIF} text-[18px] font-black leading-none sm:text-[20px]`}>{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 pb-0.5 text-[10.5px] font-bold text-[#0c3b2e] hover:text-[#0a3227]"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function SendNewsBox() {
  return (
    <div className="mt-5 border border-[#c9c3b7] bg-[#faf8f2] p-4">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#8a6b2f]">নিউজরুম</p>
      <h3 className={`${SERIF} mt-1.5 text-[17px] font-black leading-snug`}>
        আপনার এলাকার খবর পাঠান
      </h3>
      <p className={`${MUTED} mt-1.5 text-[11.5px] leading-relaxed`}>
        স্থানীয় ঘটনা, তথ্য বা ছবি পাঠালে যাচাই ও অনুমোদনের পর প্রকাশ করা হবে।
      </p>
      <Link
        href="/news/create"
        className="mt-3 inline-flex h-9 items-center gap-1.5 bg-[#0c3b2e] px-3.5 text-[11.5px] font-bold text-white transition-colors hover:bg-[#0a3227]"
      >
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
        সংবাদ পাঠান
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty / failure / footer
// ---------------------------------------------------------------------------

function EmptyNewsroom() {
  return (
    <section className="mx-auto max-w-2xl py-12 text-center sm:py-16">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#0c3b2e]">
        সংবাদ ডেস্ক
      </p>
      <h1 className={`${SERIF} mt-2 text-[28px] font-black leading-tight sm:text-[34px]`}>
        এখনো কোনো সংবাদ প্রকাশিত হয়নি
      </h1>
      <p className={`${MUTED} mx-auto mt-3 max-w-md text-[13px] leading-[1.75]`}>
        অ্যাডমিন অনুমোদনের পর প্রতিটি সংবাদ এখানে প্রকাশিত হবে। প্রথম সংবাদটি হতে
        পারে আপনার এলাকারই।
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/news/create"
          className="inline-flex h-10 items-center gap-1.5 bg-[#0c3b2e] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#0a3227]"
        >
          <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
          সংবাদ পাঠান
        </Link>
        <Link
          href="/posts"
          className="inline-flex h-10 items-center border border-[#c9c3b7] px-5 text-[12px] font-bold text-[#38352f] transition-colors hover:border-[#0c3b2e] hover:text-[#0c3b2e]"
        >
          কমিউনিটি পোস্ট দেখুন
        </Link>
      </div>
    </section>
  );
}

function LoadFailure() {
  return (
    <section className="mx-auto max-w-2xl py-12 text-center sm:py-16">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#8a1c1c]">
        সংযোগ সমস্যা
      </p>
      <h1 className={`${SERIF} mt-2 text-[26px] font-black leading-tight sm:text-[32px]`}>
        সংবাদ এখন লোড করা যাচ্ছে না
      </h1>
      <p className={`${MUTED} mx-auto mt-3 max-w-md text-[13px] leading-[1.75]`}>
        অনুমোদিত সংবাদ আনতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন — পুরোনো
        সংবাদ মুছে যায়নি।
      </p>
      <Link
        href="/news"
        className="mt-5 inline-flex h-10 items-center justify-center bg-[#0c3b2e] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#0a3227]"
      >
        আবার চেষ্টা করুন
      </Link>
    </section>
  );
}

function NewsFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t-2 border-[#141414] bg-[#faf8f2]">
      <div className={`${CONTAINER} py-7`}>
        <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8a6b2f]">
              ময়মনসিংহ শেবা · সংবাদ ডেস্ক
            </p>
            <p className={`${SERIF} mt-1 text-[22px] font-black leading-tight text-[#141414]`}>
              ময়মনসিংহের <span className="text-[#0c3b2e]">নিউজ</span>
            </p>
            <p className={`${MUTED} mt-2 max-w-md text-[11.5px] leading-relaxed`}>
              ময়মনসিংহ ও আশপাশের এলাকার স্থানীয় সংবাদ, নাগরিক কণ্ঠ ও প্রয়োজনীয়
              তথ্য। প্রকাশিত সব সংবাদ মডারেটরের যাচাই ও অনুমোদনের পর প্রকাশিত হয়।
            </p>
          </div>
          <nav aria-label="সংবাদ ফুটার" className="grid grid-cols-2 gap-x-5 gap-y-2 text-[12px]">
            {[
              { href: '/news', label: 'প্রচ্ছদ' },
              { href: '/news/create', label: 'সংবাদ পাঠান' },
              { href: '/news?category=mymensingh', label: 'ময়মনসিংহ' },
              { href: '/jobs', label: 'চাকরি' },
              { href: '/buy-sell', label: 'কেনাবেচা' },
              { href: '/', label: 'ময়মনসিংহ শেবা' },
              { href: '/contact', label: 'যোগাযোগ' },
              { href: '/about', label: 'আমাদের সম্পর্কে' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-semibold text-[#38352f] transition-colors hover:text-[#0c3b2e]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-1.5 border-t border-[#ded9ce] pt-3 text-[10.5px] text-[#8a857b] sm:flex-row sm:items-center sm:justify-between">
          <p>© {toBn(year)} ময়মনসিংহ শেবা। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>ময়মনসিংহের সংবাদ, ময়মনসিংহের কণ্ঠ।</p>
        </div>
      </div>
    </footer>
  );
}
