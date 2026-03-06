import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { ShelfClient } from './shelf-client';

export const metadata: Metadata = {
  title: 'My Shelf',
};

export default async function ShelfPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // Fetch initial data server-side for fast first paint
  let initialEntries = null;
  let initialWatchlist = null;

  if (token) {
    try {
      [initialEntries, initialWatchlist] = await Promise.all([
        api.watchEntries.list(token, { limit: 40 }),
        api.watchlist.list(token),
      ]);
    } catch {
      // API might not be running yet — client will retry
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-amber text-5xl tracking-widest uppercase mb-1">
            My Shelf
          </h1>
          <p className="font-serif italic text-cream/50 text-sm">
            Everything you've watched, rated, and remembered.
          </p>
        </div>
      </div>

      <ShelfClient
        initialEntries={initialEntries?.entries ?? []}
        initialTotal={initialEntries?.pagination.total ?? 0}
        initialWatchlist={initialWatchlist?.items ?? []}
      />
    </div>
  );
}
