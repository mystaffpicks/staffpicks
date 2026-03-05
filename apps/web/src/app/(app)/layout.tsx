import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background text-cream">
      {/* Top nav — will be expanded in Phase 1 */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <a
          href="/dashboard"
          className="font-display text-amber text-2xl tracking-[0.25em] hover:opacity-80 transition-opacity"
        >
          STAFFPICKS
        </a>
        <nav className="flex items-center gap-6 font-mono text-xs tracking-widest uppercase text-mist">
          <a href="/shelf" className="hover:text-cream transition-colors">Shelf</a>
          <a href="/queue" className="hover:text-cream transition-colors">Queue</a>
          <a href="/sync" className="hover:text-cream transition-colors">Sync</a>
          <a href="/profile" className="hover:text-cream transition-colors">Profile</a>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
