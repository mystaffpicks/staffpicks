'use client';

import { useState } from 'react';
import type { WatchEntry } from '@/lib/api';

interface Props {
  entry: WatchEntry;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  watched:    'Watched',
  watching:   'Watching',
  dropped:    'Dropped',
  rewatching: 'Rewatching',
};

const STARS = [1, 2, 3, 4, 5];

function RatingDots({ rating }: { rating: number | null }) {
  if (!rating) return null;
  // Convert 1-10 scale to 5 stars (filled/half)
  const stars = rating / 2;
  return (
    <div className="flex gap-0.5 items-center">
      {STARS.map((s) => (
        <span
          key={s}
          className={`text-xs ${s <= Math.round(stars) ? 'text-amber' : 'text-mist/30'}`}
        >
          ★
        </span>
      ))}
      <span className="font-mono text-mist/60 text-xs ml-1">{rating}/10</span>
    </div>
  );
}

export function WatchEntryCard({ entry, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const imageUrl = entry.content_poster_url ?? entry.content_thumbnail_url;
  const year = entry.content_metadata?.year;

  return (
    <div className="group relative">
      {/* Poster / thumbnail */}
      <div className="aspect-[2/3] bg-surface border border-border overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={entry.content_title}
            className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <p className="font-serif text-cream/50 text-xs text-center leading-tight">
              {entry.content_title}
            </p>
          </div>
        )}

        {/* Status badge */}
        {entry.status !== 'watched' && (
          <div className="absolute top-2 left-2">
            <span className="bg-background/80 font-mono text-amber text-xs px-1.5 py-0.5 tracking-wider">
              {STATUS_LABELS[entry.status]}
            </span>
          </div>
        )}

        {/* Context menu trigger */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 text-cream w-7 h-7 flex items-center justify-center hover:bg-background"
        >
          ⋮
        </button>

        {/* Context menu */}
        {menuOpen && (
          <div className="absolute top-9 right-2 bg-surface border border-border z-10 min-w-[120px] shadow-lg">
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="w-full text-left font-mono text-xs tracking-wider uppercase px-3 py-2 text-cream hover:bg-border transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full text-left font-mono text-xs tracking-wider uppercase px-3 py-2 text-red-400 hover:bg-border transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Metadata below poster */}
      <div className="mt-2 space-y-1">
        <p className="font-sans text-cream text-xs leading-tight line-clamp-2 font-medium">
          {entry.content_title}
        </p>

        <div className="flex items-center gap-2">
          <span className="font-mono text-mist/50 text-xs uppercase tracking-wider">
            {entry.content_type}
          </span>
          {year && (
            <span className="font-mono text-mist/40 text-xs">{year}</span>
          )}
        </div>

        <RatingDots rating={entry.rating} />

        {entry.take && (
          <p className="font-serif italic text-cream/50 text-xs leading-tight line-clamp-2">
            "{entry.take}"
          </p>
        )}
      </div>
    </div>
  );
}
