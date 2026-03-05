export default function HomePage() {
  return (
    <main className="grain min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="font-display text-8xl md:text-[10rem] tracking-wider text-amber">
          STAFFPICKS
        </h1>
        <p className="font-serif italic text-cream/70 text-xl mt-2">
          Your friends work here.
        </p>
      </div>

      {/* Divider */}
      <div className="w-24 h-px bg-amber/40 mb-8" />

      {/* Tagline */}
      <p className="font-sans text-muted text-center max-w-md text-sm leading-relaxed">
        Track everything you watch. Share it with friends.
        <br />
        Your friends are the algorithm.
      </p>

      {/* CTA */}
      <div className="mt-10 flex gap-4">
        <button className="font-display tracking-widest text-sm px-8 py-3 bg-amber text-background hover:bg-amber-light transition-colors">
          GET STARTED
        </button>
        <button className="font-display tracking-widest text-sm px-8 py-3 border border-amber/40 text-amber hover:border-amber transition-colors">
          SIGN IN
        </button>
      </div>

      {/* Footer */}
      <p className="font-mono text-xs text-muted/50 mt-16 tracking-widest uppercase">
        Be kind. Rewind. Come back tomorrow.
      </p>
    </main>
  );
}
