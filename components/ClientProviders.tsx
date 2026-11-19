'use client';

import React, { useEffect, useState } from 'react';
import {
  dehydrate,
  hydrate,
  QueryClient,
  QueryClientProvider,
  type DehydratedState,
} from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { QueryCacheRestoringContext } from '@/lib/query-cache-context';
import { NativeInit } from '@/components/NativeInit';
import { ClientErrorListeners } from '@/components/ClientErrorListeners';
import { safeStorage } from '@/lib/safe';

const CACHE_KEY = 'mymensingh-sheba-query-cache-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_BYTES = 512 * 1024;
const MAX_PERSISTED_QUERIES = 20;

function cacheSizeBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

interface PersistedQueryCache {
  version: 1;
  savedAt: number;
  state: DehydratedState;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let saveTimer: number | undefined;
    const restorationTimer = window.setTimeout(() => setIsRestoring(false), 0);

    try {
      const saved = safeStorage.get(CACHE_KEY);
      if (saved && cacheSizeBytes(saved) <= MAX_CACHE_BYTES) {
        const persisted = JSON.parse(saved) as PersistedQueryCache;
        if (
          persisted.version === 1 &&
          Date.now() - persisted.savedAt < CACHE_TTL_MS &&
          Array.isArray(persisted.state?.queries)
        ) {
          const publicState = {
            ...persisted.state,
            queries: persisted.state.queries.filter(
              (query) => query.meta?.persist === true
            ),
          };
          hydrate(queryClient, publicState);
        } else {
          safeStorage.remove(CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('Saved public query cache could not be restored.', error);
    }

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        try {
          const state = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) =>
              query.state.status === 'success' && query.meta?.persist === true,
          });
          state.queries.sort(
            (a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt
          );
          state.queries = state.queries.slice(0, MAX_PERSISTED_QUERIES);

          let serialized = JSON.stringify({
            version: 1,
            savedAt: Date.now(),
            state,
          } satisfies PersistedQueryCache);
          while (cacheSizeBytes(serialized) > MAX_CACHE_BYTES && state.queries.length > 0) {
            state.queries.pop();
            serialized = JSON.stringify({
              version: 1,
              savedAt: Date.now(),
              state,
            } satisfies PersistedQueryCache);
          }
          safeStorage.set(CACHE_KEY, serialized);
        } catch (error) {
          console.warn('Public query cache could not be saved.', error);
        }
      }, 250);
    });

    return () => {
      unsubscribe();
      window.clearTimeout(saveTimer);
      window.clearTimeout(restorationTimer);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <QueryCacheRestoringContext.Provider value={isRestoring}>
        <AuthProvider>
          {children}
          <NativeInit />
          <ClientErrorListeners />
        </AuthProvider>
      </QueryCacheRestoringContext.Provider>
    </QueryClientProvider>
  );
}
