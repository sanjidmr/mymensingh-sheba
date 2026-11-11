import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { uniqueAreaNames } from '@/lib/area-names';

const PAGE_SIZE = 1000;

async function readPages(
  loadPage: (from: number, to: number) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
  column: string
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${column} area options could not be loaded: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    from += PAGE_SIZE;
  }
}

function collectAreaValues(rows: unknown[], key: string): string[] {
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const value = (row as Record<string, unknown>)[key];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
    return [];
  });
}

export async function GET() {
  const client = await createServerSideClient();
  if (!client) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  try {
    const [toletRows, serviceRows, tutorRows, staffRows, postRows, donorResult] = await Promise.all([
      readPages(
        async (from, to) => await client.from('tolet_listings').select('area_id').eq('status', 'approved').range(from, to),
        'to-let'
      ),
      readPages(
        async (from, to) => await client.from('service_listings').select('area_ids').eq('is_active', true).eq('status', 'approved').range(from, to),
        'service listing'
      ),
      readPages(
        async (from, to) => await client.from('home_tutor_profiles').select('preferred_areas').eq('status', 'approved').range(from, to),
        'tutor'
      ),
      readPages(
        async (from, to) => await client.from('staff_profiles').select('areas').eq('is_active', true).range(from, to),
        'staff'
      ),
      readPages(
        async (from, to) => await client.from('community_posts').select('area_id').eq('status', 'approved').range(from, to),
        'community post'
      ),
      client.rpc('fn_public_donor_directory'),
    ]);

    if (donorResult.error) {
      throw new Error(`Blood donor area options could not be loaded: ${donorResult.error.message}`);
    }

    const names = [
      ...collectAreaValues(toletRows, 'area_id'),
      ...collectAreaValues(serviceRows, 'area_ids'),
      ...collectAreaValues(tutorRows, 'preferred_areas'),
      ...collectAreaValues(staffRows, 'areas'),
      ...collectAreaValues(postRows, 'area_id'),
      ...collectAreaValues(Array.isArray(donorResult.data) ? donorResult.data : [], 'area_id'),
    ];

    return NextResponse.json({ areas: uniqueAreaNames(names) }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Public area options could not be loaded:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Public area options could not be loaded.' },
      { status: 500 }
    );
  }
}
