import { currentUser } from '@clerk/nextjs/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const user = await currentUser();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Friend';

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <section>
        <h1 className="font-display text-amber text-5xl tracking-widest uppercase mb-2">
          Hey, {displayName}.
        </h1>
        <p className="font-serif italic text-cream/70 text-lg">
          Your friends are watching something right now.
        </p>
      </section>

      {/* Sync prompt */}
      <section className="border-l-4 border-amber bg-surface p-6">
        <p className="font-mono text-xs tracking-widest uppercase text-mist mb-2">
          Get started
        </p>
        <h2 className="font-display text-2xl text-cream tracking-wider mb-3">
          Sync your watch history
        </h2>
        <p className="font-sans text-cream/70 text-sm mb-4 leading-relaxed">
          Take a screenshot of your Netflix, Hulu, or YouTube history and we'll extract
          everything you've watched — no logins or integrations required.
        </p>
        <a
          href="/sync"
          className="inline-block bg-amber text-background font-mono text-xs font-medium tracking-widest uppercase px-5 py-3 hover:bg-amber/90 transition-colors"
        >
          Sync now →
        </a>
      </section>

      {/* Feed placeholder */}
      <section>
        <p className="font-mono text-xs tracking-widest uppercase text-mist mb-4">
          Friends' picks
        </p>
        <div className="border border-border p-8 text-center">
          <p className="font-serif italic text-cream/40">
            Follow some friends to see what they're watching.
          </p>
        </div>
      </section>
    </div>
  );
}
