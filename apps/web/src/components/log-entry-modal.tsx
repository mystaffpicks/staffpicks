'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { WatchEntry, ContentResult } from '@/lib/api';

interface Props {
  editEntry?: WatchEntry | null;
  onSave: () => void;
  onClose: () => void;
}

type WatchStatus = 'watched' | 'watching' | 'dropped' | 'rewatching';

const STATUS_OPTIONS: { value: WatchStatus; label: string; icon: string }[] = [
  { value: 'watched',    label: 'Watched',    icon: '✓' },
  { value: 'watching',   label: 'Watching',   icon: '▶' },
  { value: 'dropped',    label: 'Dropped',    icon: '✕' },
  { value: 'rewatching', label: 'Rewatching', icon: '↺' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Unwatchable', 2: 'Very bad', 3: 'Bad', 4: 'Below average',
  5: 'Average', 6: 'Decent', 7: 'Good', 8: 'Great', 9: 'Excellent', 10: 'Masterpiece',
};

const MOOD_TAG_OPTIONS = [
  'cozy', 'intense', 'funny', 'sad', 'thought-provoking',
  'binge-worthy', 'slow-burn', 'rewatchable', 'nostalgic', 'mind-bending',
];

export function LogEntryModal({ editEntry, onSave, onClose }: Props) {
  const { getToken } = useAuth();

  // Search
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<ContentResult[]>([]);
  const [searching, setSearching]         = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentResult | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form fields
  const [status, setStatus]     = useState<WatchStatus>('watched');
  const [rating, setRating]     = useState<number | null>(null);
  const [take, setTake]         = useState('');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [watchedOn, setWatchedOn] = useState('');
  const [privacy, setPrivacy]   = useState<'public' | 'friends' | 'private'>('friends');

  // Submission
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Prefill when editing
  useEffect(() => {
    if (editEntry) {
      setSelectedContent({
        id: editEntry.content_id,
        content_type: editEntry.content_type,
        title: editEntry.content_title,
        thumbnail_url: editEntry.content_thumbnail_url ?? undefined,
        poster_url: editEntry.content_poster_url ?? undefined,
        metadata: editEntry.content_metadata ?? undefined,
      });
      setStatus(editEntry.status);
      setRating(editEntry.rating);
      setTake(editEntry.take ?? '');
      setMoodTags(editEntry.mood_tags ?? []);
      setWatchedOn(editEntry.watched_on ?? '');
      setPrivacy(editEntry.privacy_level as any ?? 'friends');
    }
  }, [editEntry]);

  // Debounced content search
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedContent(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const token = await getToken();
        if (!token) return;
        const { results } = await api.content.search(token, q);
        setSearchResults(results.slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [getToken]);

  const handleSubmit = async () => {
    if (!selectedContent) { setError('Please select a title first.'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      if (editEntry) {
        await api.watchEntries.update(token, editEntry.id, {
          status,
          rating,
          take: take || null,
          mood_tags: moodTags,
          watched_on: watchedOn || null,
          privacy_level: privacy,
        } as any);
      } else {
        await api.watchEntries.create(token, {
          content_id: selectedContent.id,
          status,
          ...(rating   !== null && { rating }),
          ...(take               && { take }),
          ...(moodTags.length    && { mood_tags: moodTags }),
          ...(watchedOn          && { watched_on: watchedOn }),
          privacy_level: privacy,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMoodTag = (tag: string) =>
    setMoodTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-2xl tracking-widest uppercase text-cream">
              {editEntry ? 'Edit entry' : 'Log something'}
            </h2>
            <p className="font-mono text-xs tracking-wider uppercase text-mist/60 mt-0.5">
              {editEntry ? editEntry.content_title : 'What did you watch?'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-mist hover:text-cream transition-colors text-xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Content search (hidden when editing) */}
          {!editEntry && (
            <div>
              <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
                Title
              </label>

              {selectedContent ? (
                /* Selected content chip */
                <div className="flex items-center gap-3 bg-background border border-amber p-3">
                  {(selectedContent.poster_url || selectedContent.thumbnail_url) && (
                    <img
                      src={selectedContent.poster_url ?? selectedContent.thumbnail_url}
                      alt={selectedContent.title}
                      className="w-10 h-14 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-cream text-sm font-medium truncate">
                      {selectedContent.title}
                    </p>
                    <p className="font-mono text-mist/60 text-xs uppercase tracking-wider">
                      {selectedContent.content_type}
                      {(selectedContent.metadata as any)?.year && ` · ${(selectedContent.metadata as any).year}`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedContent(null); setSearchQuery(''); setSearchResults([]); }}
                    className="text-mist hover:text-cream transition-colors text-sm flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ) : (
                /* Search input + results */
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search movies, shows, YouTube..."
                    autoFocus
                    className="w-full bg-background border border-border text-cream font-sans text-sm px-4 py-3 placeholder-mist/40 focus:outline-none focus:border-amber transition-colors"
                  />
                  {searching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-mist/50 animate-pulse">
                      …
                    </span>
                  )}

                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-surface border border-border border-t-0 z-10 max-h-64 overflow-y-auto shadow-lg">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.source}-${result.id}`}
                          onClick={() => { setSelectedContent(result); setSearchResults([]); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left border-b border-border/40 last:border-0"
                        >
                          {(result.poster_url || result.thumbnail_url) && (
                            <img
                              src={result.poster_url ?? result.thumbnail_url}
                              alt={result.title}
                              className="w-8 h-11 object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-sans text-cream text-sm truncate">{result.title}</p>
                            <p className="font-mono text-mist/50 text-xs uppercase tracking-wider">
                              {result.content_type}
                              {(result.metadata as any)?.year && ` · ${(result.metadata as any).year}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
              Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`
                    py-2.5 font-mono text-xs tracking-wider uppercase transition-colors border
                    ${status === opt.value
                      ? 'bg-amber text-background border-amber'
                      : 'bg-background text-mist border-border hover:border-amber/50 hover:text-cream'}
                  `}
                >
                  <span className="block text-base mb-0.5">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
              Rating {rating && <span className="text-amber normal-case font-sans tracking-normal">— {RATING_LABELS[rating]}</span>}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(rating === n ? null : n)}
                  className={`
                    w-9 h-9 font-mono text-sm transition-colors border
                    ${rating === n
                      ? 'bg-amber text-background border-amber'
                      : 'bg-background text-mist border-border hover:border-amber/50 hover:text-cream'}
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Take / review */}
          <div>
            <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
              Your take <span className="normal-case font-sans text-mist/40 tracking-normal">(optional)</span>
            </label>
            <textarea
              value={take}
              onChange={(e) => setTake(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What did you think? Any spoiler-free reaction..."
              className="w-full bg-background border border-border text-cream font-serif text-sm px-4 py-3 placeholder-mist/30 focus:outline-none focus:border-amber transition-colors resize-none italic"
            />
            <p className="font-mono text-xs text-mist/30 text-right mt-1">{take.length}/500</p>
          </div>

          {/* Mood tags */}
          <div>
            <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
              Vibes
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleMoodTag(tag)}
                  className={`
                    font-mono text-xs px-3 py-1.5 border transition-colors
                    ${moodTags.includes(tag)
                      ? 'bg-amber/20 border-amber text-amber'
                      : 'bg-background border-border text-mist hover:border-amber/40 hover:text-cream'}
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Watched on date + privacy row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
                Date watched
              </label>
              <input
                type="date"
                value={watchedOn}
                onChange={(e) => setWatchedOn(e.target.value)}
                className="w-full bg-background border border-border text-cream font-mono text-sm px-3 py-2.5 focus:outline-none focus:border-amber transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest uppercase text-mist block mb-2">
                Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="w-full bg-background border border-border text-cream font-mono text-sm px-3 py-2.5 focus:outline-none focus:border-amber transition-colors"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-mono text-xs text-red-400 border border-red-400/30 bg-red-400/10 px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || (!editEntry && !selectedContent)}
            className="w-full bg-amber text-background font-mono text-sm font-medium tracking-widest uppercase py-4 hover:bg-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : editEntry ? 'Save changes' : 'Log it'}
          </button>
        </div>
      </div>
    </div>
  );
}
