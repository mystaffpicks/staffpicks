'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { WatchEntry, WatchlistItem } from '@/lib/api';
import { api } from '@/lib/api';
import { LogEntryModal } from '@/components/log-entry-modal';
import { WatchEntryCard } from '@/components/watch-entry-card';

type FilterTab = 'all' | 'watched' | 'watching' | 'dropped' | 'want';

interface Props {
  initialEntries: WatchEntry[];
  initialTotal: number;
  initialWatchlist: WatchlistItem[];
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'watched',  label: 'Watched' },
  { id: 'watching', label: 'Watching' },
  { id: 'dropped',  label: 'Dropped' },
  { id: 'want',     label: 'Want to Watch' },
];

export function ShelfClient({ initialEntries, initialTotal, initialWatchlist }: Props) {
  const { getToken } = useAuth();

  const [entries, setEntries]     = useState<WatchEntry[]>(initialEntries);
  const [total, setTotal]         = useState(initialTotal);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<WatchEntry | null>(null);
  const [loading, setLoading]     = useState(false);

  const refreshEntries = useCallback(async (tab: FilterTab = activeTab) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const params = tab === 'want' ? {} : tab === 'all' ? {} : { status: tab };
      const data = await api.watchEntries.list(token, { limit: 40, ...params });
      setEntries(data.entries);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, getToken]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    refreshEntries(tab);
  };

  const handleLogSaved = async () => {
    setShowModal(false);
    setEditEntry(null);
    await refreshEntries();
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    await api.watchEntries.delete(token, id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const handleEdit = (entry: WatchEntry) => {
    setEditEntry(entry);
    setShowModal(true);
  };

  // Filtered display — "want" tab shows watchlist
  const displayEntries = activeTab === 'want' ? [] : entries;
  const displayWatchlist = activeTab === 'want' ? watchlist : [];

  const isEmpty = activeTab === 'want'
    ? displayWatchlist.length === 0
    : displayEntries.length === 0;

  return (
    <>
      {/* Filter tabs + Log button row */}
      <div className="flex items-center justify-between border-b border-border pb-0">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                font-mono text-xs tracking-widest uppercase px-4 py-3 border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-amber text-amber'
                  : 'border-transparent text-mist hover:text-cream'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setEditEntry(null); setShowModal(true); }}
          className="bg-amber text-background font-mono text-xs font-medium tracking-widest uppercase px-5 py-2.5 hover:bg-amber/90 transition-colors"
        >
          + Log something
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <p className="font-mono text-xs tracking-widest uppercase text-mist animate-pulse">
            Loading…
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <div className="border border-border py-20 text-center">
          {activeTab === 'want' ? (
            <>
              <p className="font-serif italic text-cream/40 text-lg mb-3">
                Your watchlist is empty.
              </p>
              <p className="font-sans text-cream/30 text-sm">
                Add something you want to watch when you log it.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif italic text-cream/40 text-lg mb-4">
                Nothing here yet.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="font-mono text-xs tracking-widest uppercase text-amber hover:text-amber/80 transition-colors"
              >
                Log your first watch →
              </button>
            </>
          )}
        </div>
      )}

      {/* Entry grid */}
      {!loading && !isEmpty && activeTab !== 'want' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayEntries.map((entry) => (
              <WatchEntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => handleEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
          {total > entries.length && (
            <p className="font-mono text-xs tracking-widest uppercase text-mist/50 text-center pt-4">
              Showing {entries.length} of {total}
            </p>
          )}
        </>
      )}

      {/* Watchlist grid */}
      {!loading && activeTab === 'want' && displayWatchlist.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayWatchlist.map((item) => (
            <div key={item.id} className="group relative">
              <div className="aspect-[2/3] bg-surface border border-border overflow-hidden">
                {item.content_poster_url || item.content_thumbnail_url ? (
                  <img
                    src={item.content_poster_url ?? item.content_thumbnail_url ?? ''}
                    alt={item.content_title}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <p className="font-serif text-cream/50 text-xs text-center leading-tight">
                      {item.content_title}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="font-sans text-cream text-xs leading-tight line-clamp-2">
                  {item.content_title}
                </p>
                <p className="font-mono text-mist/60 text-xs mt-0.5 uppercase tracking-wider">
                  {item.content_type}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Entry Modal */}
      {showModal && (
        <LogEntryModal
          editEntry={editEntry}
          onSave={handleLogSaved}
          onClose={() => { setShowModal(false); setEditEntry(null); }}
        />
      )}
    </>
  );
}
