'use client';

/**
 * কেনা-বেচা — a single product page (`/buy-sell/[slug]`).
 *
 * A real page, not a wrapper around the shared `PostDetail`. The shared
 * component treats buy-sell as one of three post kinds and prints the same
 * skeleton for all three, which is right for news and wrong here: a marketplace
 * item is a photo, a price and a phone number, and the page has to be built
 * around that order rather than around an article body.
 *
 * What this page adds over `PostDetail`:
 *   - the photo gallery (cover + `gallery`), with per-image failure handling
 *   - the price as the headline, with the condition beside it
 *   - the seller's contact, fetched through `fetchMarketContact` — see
 *     `SellerCard` for why that is an RPC and not a column
 *   - favourite, share, report
 *   - a foot of similar items in the same category, so a reader who does not
 *     want this one has somewhere to go
 *
 * Everything optional stays optional. A post with no price shows "দাম আলোচনা", a
 * post with no condition shows no condition row, and a post with one photo gets
 * no thumbnail strip — no placeholder, no dash, no invented value.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Flag,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Share2,
  ShieldAlert,
  Tag,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { ProductGallery } from '@/components/buy-sell/ProductGallery';
import { SellerCard } from '@/components/buy-sell/SellerCard';
import { ReportListingSheet } from '@/components/buy-sell/ReportListingSheet';
import { ProductCard } from '@/components/buy-sell/ProductCard';
import {
  fetchApprovedPosts,
  fetchMarketContact,
  fetchPostForViewer,
} from '@/lib/catalog-service';
import { useAuth } from '@/lib/auth-context';
import {
  bnRelativeTime,
  bnTaka,
  tagLabel,
  tagLabels,
  type CommunityPost,
} from '@/lib/catalog-types';
import { getAreaById } from '@/lib/locations';

type Contact = { authorName?: string; authorPhone?: string; whatsappNumber?: string } | null;
type Phase = 'idle' | 'loading' | 'ready' | 'none';

/** The condition band, resolved back to Bangla. The label wins when present. */
function conditionOf(post: CommunityPost): string | undefined {
  if (post.conditionLabel) return tagLabel(post.conditionLabel);
  const hit = post.tags.find((t) => ['new', 'like-new', 'good', 'used'].includes(t));
  return hit ? tagLabel(hit) : undefined;
}

export default function MarketDetail({ slug }: { slug: string }) {
  const { user, savedListings, toggleSaveItem } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<Contact>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [similar, setSimilar] = useState<CommunityPost[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [guestFavorite, setGuestFavorite] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPostForViewer('buy_sell', slug);
        if (!active) return;
        setPost(data);
        if (data) {
          setPhase('loading');
          // The contact is a second request because it is a separate permission
          // question from reading the post. Fetching the post first also means
          // the page paints its photo before it waits on the RPC.
          const c = await fetchMarketContact(slug);
          if (!active) return;
          setContact(c);
          setPhase(c ? 'ready' : 'none');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  // Same category first, then anything else, so the row is never empty on a
  // small marketplace. Excludes this post.
  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchApprovedPosts('buy_sell');
      if (!active) return;
      const pool = rows.filter((p) => p.slug !== slug);
      const sameCategory = pool.filter((p) => p.category && p.category === post?.category);
      const rest = pool.filter((p) => !sameCategory.includes(p));
      setSimilar([...sameCategory, ...rest].slice(0, 5));
    })();
    return () => {
      active = false;
    };
  }, [slug, post?.category]);

  const toggleFavorite = useCallback(async () => {
    if (!post) return;
    const alreadySaved = savedListings.some(
      (item) => item.itemType === 'market' && item.linkHref === `/buy-sell/${post.slug}`
    );
    const next = !alreadySaved;
    if (!user) {
      // A guest's shortlist is session-local and says so; pretending it syncs
      // would lose the list on the next navigation without warning.
      setGuestFavorite(next);
      return;
    }
    const area = post.areaId ? getAreaById(post.areaId)?.nameBn : undefined;
    try {
      await toggleSaveItem({
        itemType: 'market',
        title: post.titleBn,
        areaName: area ?? '',
        priceOrRate: post.price != null ? bnTaka(post.price) : undefined,
        linkHref: `/buy-sell/${post.slug}`,
      });
    } catch {
      // Saving is best-effort and must never take the page down with it.
    }
  }, [post, savedListings, toggleSaveItem, user]);

  /**
   * Share.
   *
   * `navigator.share` first because on a phone it puts the item in WhatsApp,
   * which is how a buyer actually sends it to a sibling. The clipboard is the
   * fallback, and when even that is refused there is nothing to recover — so
   * the canonical URL is printed in the page's own footer anyway and the reader
   * can copy it from there.
   */
  const share = useCallback(async () => {
    if (!post) return;
    const url = `${window.location.origin}/buy-sell/${post.slug}`;
    const text = `${post.titleBn}${post.price != null ? ` — ${bnTaka(post.price)}` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.titleBn, text, url });
        return;
      } catch {
        // Dismissed, or the OS sheet failed. Fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 2000);
    } catch {
      setShareState('idle');
    }
  }, [post]);

  const savedForThisPost = useMemo(
    () =>
      savedListings.find(
        (item) => item.itemType === 'market' && item.linkHref === `/buy-sell/${post?.slug}`
      ) ?? null,
    [savedListings, post?.slug]
  );
  const isFavorite = user ? Boolean(savedForThisPost) : guestFavorite;

  if (loading) {
    return (
      <Frame>
        <div>
          <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-mist-100 sm:aspect-[16/10]" aria-hidden="true" />
          <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-mist-100" aria-hidden="true" />
          <div className="mt-2.5 h-4 w-1/3 animate-pulse rounded bg-mist-100" aria-hidden="true" />
          <p className="mt-6 text-center text-sm text-ink-500">লোড হচ্ছে…</p>
        </div>
      </Frame>
    );
  }

  if (!post) {
    return (
      <Frame>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
          <h1 className="text-lg font-extrabold text-ink-900">বিজ্ঞাপনটি পাওয়া যায়নি</h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
            বিজ্ঞাপনটি হয় অনুমোদনের অপেক্ষায় আছে, অথবা আর প্রকাশিত নেই। অন্য কোনো পণ্য
            দেখুন।
          </p>
          <Link
            href="/buy-sell"
            className={`mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-5 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            সব পণ্য দেখুন
          </Link>
        </div>
      </Frame>
    );
  }

  const isAuthor = Boolean(user && post.authorId === user.id);
  const area = post.areaId ? getAreaById(post.areaId)?.nameBn : undefined;
  const condition = conditionOf(post);
  const posted = bnRelativeTime(post.publishedAt ?? post.createdAt, now);
  // `gallery` holds the photos after the cover. A post that filed one image gets
  // just the cover and no strip.
  const photos = [post.coverImageUrl, ...(post.gallery ?? [])].filter(
    (url): url is string => Boolean(url)
  );
  const extras = post.tags.filter(
    (tag) => tag !== post.category && !['new', 'like-new', 'good', 'used'].includes(tag)
  );

  return (
    <Frame>
      <div>
        {/* `min-h-11` because this is the page's only way back; a 19px link is a
            19px target. Negative margin keeps the photo from being pushed
            down by the padding it adds. */}
        <Link
          href="/buy-sell"
          className={`-ml-1 inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:text-brand-700 ${LIGHT_FOCUS}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          সব পণ্য
        </Link>

        {post.isDemo && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-100/50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-accent-700">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              এটি একটি <strong className="font-bold">নমুনা বিজ্ঞাপন</strong>। বিক্রেতার
              নম্বর দেওয়া হয়নি, তাই কল করা যাবে না। প্রকৃত বিজ্ঞাপনে সরাসরি কল করা যায়।
            </span>
          </p>
        )}

        {post.status !== 'approved' && isAuthor && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-[12.5px] leading-relaxed text-amber-900">
              {post.status === 'pending'
                ? 'এই বিজ্ঞাপনটি অ্যাডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদনের পর সবার জন্য দেখা যাবে।'
                : 'এই বিজ্ঞাপনটি অনুমোদিত হয়নি। কারণ জানতে চাইলে সম্পাদনা করে আবার পাঠাতে পারেন।'}
            </p>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* ---------------------------------------------------------------
              Main column: photo, then what it is, then what they wrote.
              --------------------------------------------------------------- */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ProductGallery
              photos={photos}
              alt={post.titleBn}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />

            <div className="mt-3 rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                {post.category && (
                  <span className="rounded-md border border-brand-100 bg-mist-50 px-2 py-0.5 text-[11px] font-extrabold text-brand-700">
                    {tagLabel(post.category)}
                  </span>
                )}
                {condition && (
                  <span className="rounded-md border border-mist-200 bg-white px-2 py-0.5 text-[11px] font-bold text-ink-600">
                    {condition}
                  </span>
                )}
                {post.isFeatured && post.status === 'approved' && (
                  <span className="rounded-md bg-accent-400 px-2 py-0.5 text-[11px] font-extrabold text-brand-950">
                    ফিচার্ড
                  </span>
                )}
              </div>

              {/* The price is the headline. On a marketplace the price decides
                  whether the reader keeps reading, so it is the largest text on
                  the page — above the title, not buried under it. */}
              <p className="mt-2.5 text-[26px] font-black leading-none tracking-tight text-brand-800 sm:text-[30px]">
                {post.price != null ? bnTaka(post.price) : 'দাম আলোচনা'}
              </p>

              <h1 className="mt-2 text-[17px] font-extrabold leading-snug text-ink-900 sm:text-xl">
                {post.titleBn}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
                {area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                    {area}
                  </span>
                )}
                {posted && <span>{posted}</span>}
                {post.authorName && <span>বিক্রেতা: {post.authorName}</span>}
              </div>

              {post.summaryBn && (
                <p className="mt-3 rounded-xl border border-mist-200 bg-mist-50 p-3 text-[13.5px] font-medium leading-relaxed text-ink-700">
                  {post.summaryBn}
                </p>
              )}

              {post.bodyBn && (
                <div className="mt-3.5 space-y-3 text-[14px] leading-[1.75] text-ink-700">
                  {post.bodyBn
                    .split(/\n{2,}/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              )}

              {extras.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {extras.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-lg border border-mist-200 bg-mist-50 px-2.5 py-1 text-[11.5px] font-medium text-ink-600"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Similar items. Without this, a reader whose buyer bought this one
                has to go back and start again. */}
            {similar.length > 0 && (
              <section className="mt-4">
                <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
                  <Tag className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  আরও কিছু পণ্য
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {similar.map((item) => (
                    <ProductCard key={item.id} post={item} now={now} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ---------------------------------------------------------------
              Side column: who to call, and the two small actions.
              --------------------------------------------------------------- */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-3 lg:sticky lg:top-4">
              <SellerCard
                post={post}
                contact={contact}
                phase={phase}
                isAuthor={isAuthor}
                signedIn={Boolean(user)}
                onRequestContact={() => setReportOpen(true)}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={share}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-mist-200 bg-white px-3 text-[12.5px] font-bold text-ink-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
                >
                  {shareState === 'copied' ? (
                    <>
                      <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                      লিংক কপি হয়েছে
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      শেয়ার করুন
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-mist-200 bg-white px-3 text-[12.5px] font-bold text-ink-600 transition-colors hover:border-rose-200 hover:text-rose-600 ${LIGHT_FOCUS}`}
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  রিপোর্ট
                </button>
              </div>

              {isAuthor && (
                <div className="flex flex-wrap gap-2">
                  {/* Editing re-enters moderation, and `fetchMyPostForEdit`
                      deliberately refuses an approved row — so an approved post
                      gets no edit button rather than a link to a not-found page.
                      An approved seller who wants the item down should ask an
                      admin, which is what `/profile/posts` is for. */}
                  {post.status !== 'approved' && (
                    <Link
                      href={`/profile/posts/buy_sell/${post.id}/edit`}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 text-[12.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
                    >
                      সম্পাদনা
                    </Link>
                  )}
                  <Link
                    href="/profile/posts"
                    className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-mist-200 bg-white px-4 text-[12.5px] font-bold text-ink-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
                  >
                    আমার সব পোস্ট
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Safety footer. Present on every item, not only the demo ones: a real
            marketplace still has sellers who ask for an advance payment. */}
        <section className="mt-5 rounded-2xl border border-mist-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink-900">
            <Home className="h-4 w-4 text-brand-600" aria-hidden="true" />
            নিরাপদে কেনাবেচা করুন
          </h2>
          <ul className="mt-2 space-y-1.5">
            {[
              'পণ্য হাতে পেয়ে তবেই টাকা ছাড়ুন — অগ্রিম টাকা পাঠাবেন না।',
              'পণ্য দেখে ঠিক না হলে ফেরত নেওয়ার আগেই সিদ্ধান্ত নিন।',
              'কোনো টাকা বা ছবি চাইলে সরাসরি অ্যাডমিনকে জানান।',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-600">
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-400"
                  aria-hidden="true"
                />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href="/buy-sell"
            className={`inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-bold text-ink-500 ${LIGHT_FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            সব পণ্য দেখুন
          </Link>
          <Link
            href="/buy-sell/create"
            className={`ml-auto inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-bold text-brand-700 ${LIGHT_FOCUS}`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            আমার পণ্য বিক্রি করতে চাই
          </Link>
        </div>
      </div>

      <ReportListingSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        postId={post.id}
        postTitle={post.titleBn}
        reporterId={user?.id ?? null}
        reporterName={user?.fullName ?? 'অতিথি'}
      />
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  // No global Footer, matching the other listing and detail pages: the page ends
  // with its own content and the fixed mobile bottom nav (mounted in the root
  // layout) is the last thing on screen.
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}