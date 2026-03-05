export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none grain opacity-40" aria-hidden="true" />

      {/* Wordmark */}
      <a
        href="/"
        className="font-display text-amber text-4xl tracking-[0.25em] mb-10 hover:opacity-80 transition-opacity"
      >
        STAFFPICKS
      </a>

      {/* Clerk component renders here */}
      {children}

      <p className="mt-10 font-mono text-xs text-mist tracking-widest uppercase">
        Be kind. Rewind.
      </p>
    </main>
  );
}
