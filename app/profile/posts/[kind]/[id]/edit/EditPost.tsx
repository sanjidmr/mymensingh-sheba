'use client';

/**
 * Edit screen for one of the reader's own unapproved posts.
 *
 * The post is resolved on the client by the service layer, which scopes the query
 * to the signed-in author's id. A post that is already approved, belongs to
 * someone else, or does not exist all produce the same "not found" page — the
 * page must not reveal that a particular id exists in moderation.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PostForm from '@/components/catalog/PostForm';
import PostAuthGate from '@/components/catalog/PostAuthGate';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import { fetchMyPostForEdit } from '@/lib/catalog-service';
import type { CommunityPost } from '@/lib/catalog-types';

export default function EditPost({ postId }: { postId: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  // Same reasoning as `MyPosts`: "no user to fetch for" and "fetch finished"
  // are one state, so tracking `loaded` lets the spinner be derived instead of
  // forcing the effect to synchronously setState "not loading" and cascade a
  // render before the first paint.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const data = await fetchMyPostForEdit(postId);
        if (active) setPost(data);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, postId]);

  const loading = !!user && !loaded;

  if (authLoading || loading) {
    return (
      <Frame>
        <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-xl bg-mist-100" />
      </Frame>
    );
  }

  if (!post) {
    return (
      <Frame>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <h1 className="text-lg font-extrabold text-ink-900">পোস্টটি পাওয়া যায়নি</h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
            এই পোস্টটি সম্পাদনার জন্য উপলব্ধ নয় — এটি হয়তো ইতিমধ্যে প্রকাশিত হয়েছে, অথবা
            অন্য কারো পোস্ট। লিংকটি ভুল হলে আমার পোস্ট তালিকা দেখুন।
          </p>
          <Link
            href="/profile/posts"
            className={`mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
          >
            আমার পোস্টে ফিরে যান
          </Link>
        </div>
      </Frame>
    );
  }

  return (
    <PostAuthGate next="/profile/posts">
      {/* `key` on the post id is what makes the form's lazy seed correct: a
          different post is a different component instance, so the fields are
          seeded once at mount instead of being re-seeded by an effect that
          could also clobber half-typed input. */}
      <PostForm key={post.id} kind={post.kind} editing={post} />
    </PostAuthGate>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">{children}</main>
      <Footer />
    </div>
  );
}
