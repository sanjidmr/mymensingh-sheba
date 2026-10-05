'use client';

/**
 * "My posts" — everything the signed-in member has submitted.
 *
 * Grouped by moderation state rather than shown as one undifferentiated list,
 * because the three states mean genuinely different things to the author:
 * a pending post is queued, an approved post is live, and a rejected post needs
 * a fix before it can be resubmitted. The new-post links here are where a
 * member lands after submitting, so the `submitted` param is what confirms the
 * write actually landed.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Plus, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MyPostRow } from '@/components/catalog/CommunityCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import { fetchMyPosts } from '@/lib/catalog-service';
import type { CommunityPost, PostKind, PostStatus } from '@/lib/catalog-types';

const GROUPS: {
  status: PostStatus;
  title: string;
  blurb: string;
  icon: typeof Clock;
  iconClass: string;
}[] = [
  {
    status: 'pending',
    title: 'অনুমোদনের অপেক্ষায়',
    blurb: 'অ্যাডমিন যাচাই করার পর প্রকাশিত হবে।',
    icon: Clock,
    iconClass: 'text-amber-600',
  },
  {
    status: 'approved',
    title: 'প্রকাশিত',
    blurb: 'এই পোস্টগুলো সবার জন্য দেখা যাচ্ছে।',
    icon: CheckCircle2,
    iconClass: 'text-brand-600',
  },
  {
    status: 'rejected',
    title: 'অনুমোদিত হয়নি',
    blurb: 'সম্পাদনা করে আবার পাঠালে নতুন করে অনুমোদন দেখা হবে।',
    icon: XCircle,
    iconClass: 'text-red-600',
  },
];

const CREATE_LINKS = [
  { href: '/news/create', label: 'সংবাদ' },
  { href: '/jobs/create', label: 'চাকরির খবর' },
  { href: '/buy-sell/create', label: 'বিক্রয়ের পোস্ট' },
];

export default function MyPosts() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const submittedSlug = searchParams.get('submitted');

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  // `loaded` rather than `loading`: there is no user to fetch for, so "done"
  // and "nothing to wait for" are the same state. Deriving the spinner from
  // `!loaded` below means the effect never has to synchronously setState to
  // "not loading", which is what caused the cascading re-render.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const data = await fetchMyPosts();
        if (active) setPosts(data);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Only wait while there is actually an account whose posts are in flight.
  const loading = !!user && !loaded;

  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        items: posts.filter((p) => p.status === group.status),
      })),
    [posts]
  );

  if (authLoading || loading) {
    return (
      <Frame>
        <div className="mx-auto max-w-3xl">
          <div className="h-64 animate-pulse rounded-xl bg-mist-100" aria-hidden="true" />
        </div>
      </Frame>
    );
  }

  if (!user) {
    return (
      <Frame>
        <div className="mx-auto max-w-md py-12 text-center">
          <h1 className="text-lg font-extrabold text-ink-900">লগইন প্রয়োজন</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            আপনার পোস্টগুলো দেখতে লগইন করুন।
          </p>
          <Link
            href="/login?next=%2Fprofile%2Fposts"
            className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            লগইন করুন
          </Link>
        </div>
      </Frame>
    );
  }

  const justSubmitted = submittedSlug
    ? posts.find((p) => p.slug === submittedSlug)
    : undefined;

  return (
    <Frame>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-extrabold text-ink-900 sm:text-2xl">আমার পোস্ট</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
          আপনার দেওয়া সব পোস্ট এখানে দেখা যাবে। অনুমোদনের অবস্থা অনুযায়ী নিচে ভাগ করা হয়েছে।
        </p>

        {justSubmitted && (
          <p className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-[12.5px] font-medium leading-relaxed text-brand-900">
            আপনার পোস্টটি সংরক্ষিত হয়েছে এবং অ্যাডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদন
            হলে এটি সবার জন্য দেখা যাবে।
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {CREATE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white px-5 py-9 text-center">
            <h2 className="text-base font-extrabold text-ink-900">
              এখনো কোনো পোস্ট করেননি
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-500">
              উপরের যেকোনো লিংক থেকে প্রথম পোস্টটি করুন। পোস্টটি অ্যাডমিন
              অনুমোদনের পর প্রকাশিত হবে।
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {grouped
              .filter((group) => group.items.length > 0)
              .map((group) => {
                const Icon = group.icon;
                return (
                  <section key={group.status}>
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${group.iconClass}`}
                        aria-hidden="true"
                      />
                      <h2 className="text-[14px] font-extrabold text-ink-900 sm:text-base">
                        {group.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-mist-50 px-1.5 py-[2px] text-[10.5px] font-bold text-ink-500">
                        {group.items.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-400">{group.blurb}</p>
                    <ul className="mt-2 space-y-2">
                      {group.items.map((post) => (
                        <li key={post.id}>
                          <MyPostRow
                            post={post}
                            href={
                              post.status === 'approved'
                                ? `${ROUTE[post.kind]}/${post.slug}`
                                : `/profile/posts/${post.kind}/${post.id}/edit`
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
          </div>
        )}
      </div>
    </Frame>
  );
}

/** Public route per post kind. */
const ROUTE: Record<PostKind, string> = {
  news: '/news',
  job: '/jobs',
  buy_sell: '/buy-sell',
};

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">{children}</main>
      <Footer />
    </div>
  );
}
