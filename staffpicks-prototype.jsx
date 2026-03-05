import { useState, useEffect } from "react";

const C = {
  bg: "#16120E",
  shelf: "#1E1914",
  card: "#262019",
  cardHover: "#2E2720",
  wood: "#2A2118",
  woodLight: "#3A3128",
  text: "#EDE4D4",
  textWorn: "#C4B8A4",
  textFaded: "#8A7E6E",
  textGhost: "#5C5244",
  amber: "#E8A44A",
  amberDim: "#C48838",
  amberGlow: "rgba(232,164,74,0.08)",
  amberSoft: "rgba(232,164,74,0.14)",
  teal: "#5BA3A3",
  tealSoft: "rgba(91,163,163,0.14)",
  coral: "#D4776B",
  coralSoft: "rgba(212,119,107,0.14)",
  cream: "#F5EEE0",
  stickerYellow: "#F2D974",
  stickerBlue: "#7BAFD4",
  stickerPink: "#E8A0B4",
  border: "#3A3228",
  borderWorn: "#2E2820",
};

const F = {
  display: "'Bebas Neue', 'Impact', sans-serif",
  serif: "'Libre Baskerville', 'Georgia', serif",
  sans: "'Karla', 'Helvetica Neue', sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`;

const SCANLINES = `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`;

const SHELF_SHADOW = "inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.02)";

const POSTER_COLORS = {
  "Severance": ["#1E3A5C", "#0D1F33"], "The Bear": ["#8B4513", "#5C2D0A"],
  "Shōgun": ["#7A1E1E", "#4A0E0E"], "3 Body Problem": ["#1A3A4A", "#0D1F28"],
  "Dune: Part Two": ["#C4A35A", "#8A7030"], "Veritasium": ["#2D6B4F", "#1A4030"],
  "White Lotus": ["#4A7C59", "#2D4D38"], "Beef": ["#8B2500", "#5C1800"],
  "Baby Reindeer": ["#4A3F6B", "#2D2640"], "How To with John Wilson": ["#5C7C3E", "#3A5028"],
  "Succession": ["#2C3E50", "#1A2530"], "Love Island": ["#E74C8B", "#A03060"],
  "Stranger Things": ["#B71C1C", "#7A1010"], "MrBeast": ["#1565C0", "#0D4080"],
  "True Detective": ["#1B3A2D", "#0D201A"], "Mark Rober": ["#E65100", "#983500"],
  "Demon Slayer": ["#4A148C", "#2D0A58"], "The Office": ["#5D7B3A", "#3A4D24"],
  "Making a Murderer": ["#3E2723", "#241814"], "Planet Earth": ["#1B5E20", "#103A14"],
  "Khaby Lame": ["#FF6F00", "#B04D00"], "Wednesday": ["#1A1A2E", "#0D0D1A"],
  "Bluey": ["#1976D2", "#0D4A8A"], "MKBHD": ["#D32F2F", "#8A1E1E"],
  "Ripley": ["#2C3E50", "#1A2530"], "Fallout": ["#4A6741", "#2D4028"],
  "Civil War": ["#5A4A3A", "#3A3028"], "The Last of Us": ["#3A4A2A", "#242D1A"],
  "Poker Face": ["#7B3F5D", "#4D2838"],
};

function getPoster(title) { return POSTER_COLORS[title] || ["#3A3228", "#1E1A14"]; }

const MOCK_SHOWS = [
  { id: 1, title: "Severance", platform: "Apple TV+", genre: "Thriller", status: "watching", episode: "S2 E6", progress: 72, rating: 9 },
  { id: 2, title: "The Bear", platform: "Hulu", genre: "Drama", status: "watched", rating: 8 },
  { id: 3, title: "Shōgun", platform: "Hulu", genre: "Historical", status: "watched", rating: 10 },
  { id: 4, title: "3 Body Problem", platform: "Netflix", genre: "Sci-Fi", status: "watching", episode: "S1 E5", progress: 55 },
  { id: 5, title: "Dune: Part Two", platform: "Max", genre: "Sci-Fi", status: "watched", rating: 9 },
  { id: 6, title: "Veritasium", platform: "YouTube", genre: "Science", status: "watching" },
  { id: 7, title: "White Lotus", platform: "Max", genre: "Satire", status: "watched", rating: 7 },
  { id: 8, title: "Beef", platform: "Netflix", genre: "Dark Comedy", status: "watched", rating: 8 },
];

const TASTE_ANCHORS = [
  "Succession", "The Bear", "Love Island", "Stranger Things",
  "MrBeast", "True Detective", "Mark Rober", "Severance",
  "Demon Slayer", "The Office", "Making a Murderer", "Planet Earth",
  "Khaby Lame", "Wednesday", "Bluey", "MKBHD",
];

const MOOD_OPTIONS = [
  { id: "cozy", label: "Comfort rewatch", sub: "Something familiar", icon: "☕" },
  { id: "binge", label: "Can't-stop binge", sub: "One more episode", icon: "🌙" },
  { id: "background", label: "Background watch", sub: "While multitasking", icon: "📺" },
  { id: "rabbit", label: "YouTube deep dive", sub: "Algorithm decides", icon: "🕳️" },
  { id: "scroll", label: "Short-form scroll", sub: "TikTok, Reels, Shorts", icon: "📱" },
  { id: "cinema", label: "Proper film night", sub: "Lights off, full focus", icon: "🎬" },
];

const PLATFORMS = [
  { id: "netflix", name: "Netflix", color: "#E50914" },
  { id: "youtube", name: "YouTube", color: "#FF0000" },
  { id: "disney", name: "Disney+", color: "#113CCF" },
  { id: "hulu", name: "Hulu", color: "#1CE783" },
  { id: "max", name: "Max", color: "#002BE7" },
  { id: "apple", name: "Apple TV+", color: "#666" },
  { id: "prime", name: "Prime Video", color: "#00A8E1" },
  { id: "tiktok", name: "TikTok", color: "#EE1D52" },
];

const FRIENDS = [
  { id: 1, name: "Sarah M.", initial: "S", action: "finished", show: "White Lotus", take: "The ending was perfect. Not a single wasted scene.", rating: 9, time: "2h ago", sticker: "stickerYellow" },
  { id: 2, name: "Jake R.", initial: "J", action: "started", show: "Severance S2", take: null, rating: null, time: "4h ago", sticker: "stickerBlue" },
  { id: 3, name: "Mia C.", initial: "M", action: "shared a clip from", show: "The Bear S3", take: "This 3-minute scene is why I started cooking again.", rating: null, time: "6h ago", hasClip: true, sticker: "stickerPink" },
  { id: 4, name: "Tom L.", initial: "T", action: "watched", show: "Dune: Part Two", take: "See this on the biggest screen you can find.", rating: 10, time: "Yesterday", sticker: "stickerYellow" },
];

const SYNC_RESULTS = [
  { id: 1, title: "Severance", episode: "S2 E7", status: "watching", confidence: 0.96, platform: "Apple TV+" },
  { id: 2, title: "Baby Reindeer", episode: "S1 E3", status: "watching", confidence: 0.91, platform: "Netflix" },
  { id: 3, title: "How To with John Wilson", episode: "S3 E1", status: "new", confidence: 0.84, platform: "Max" },
];

function FadeIn({ children, delay = 0, style = {} }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.4s ease, transform 0.4s ease", ...style }}>{children}</div>;
}

function ShelfDivider({ label, sub, style: s = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, ...s }}>
      <div style={{
        background: C.woodLight, padding: "6px 14px", borderRadius: 3,
        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        border: `1px solid ${C.border}`,
      }}>
        <span style={{ fontFamily: F.display, fontSize: 14, color: C.amber, letterSpacing: "0.14em" }}>{label}</span>
        {sub && <span style={{ fontFamily: F.sans, fontSize: 10, color: C.textFaded, marginLeft: 8 }}>{sub}</span>}
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.border}, transparent)` }} />
    </div>
  );
}

function VHSSpine({ title, color, size = "md", children, selected, style: extra = {} }) {
  const colors = getPoster(title);
  const sizes = { sm: { w: 52, h: 72, f: 8, sp: 1 }, md: { w: 72, h: 100, f: 9, sp: 2 }, lg: { w: 90, h: 126, f: 10, sp: 2 } };
  const sz = sizes[size];
  return (
    <div style={{
      width: sz.w, height: sz.h, borderRadius: 4, overflow: "hidden", position: "relative", flexShrink: 0,
      background: `linear-gradient(160deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
      boxShadow: `0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), ${selected ? `0 0 0 2px ${C.amber}` : "0 0 0 0 transparent"}`,
      transition: "box-shadow 0.2s ease",
      ...extra,
    }}>
      {/* Wear marks */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)", pointerEvents: "none" }} />
      {/* Edge wear */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: sz.sp, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: sz.sp, background: "rgba(0,0,0,0.2)" }} />
      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: size === "sm" ? 4 : 6, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.55) 100%)" }}>
        <div style={{ fontFamily: F.sans, fontSize: sz.f, fontWeight: 700, color: "#fff", lineHeight: 1.15, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function RentalSticker({ text, color = C.stickerYellow, rotation = -2 }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 2,
      background: color, color: C.bg, fontFamily: F.mono, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      transform: `rotate(${rotation}deg)`, boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    }}>{text}</span>
  );
}

function ReturnStamp({ text }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", borderRadius: 2,
      border: `1.5px solid ${C.coral}`, color: C.coral, fontFamily: F.mono, fontSize: 9,
      fontWeight: 700, letterSpacing: "0.04em", opacity: 0.8,
      transform: "rotate(-1deg)",
    }}>{text}</span>
  );
}

function OnboardingMood({ onNext }) {
  const [sel, setSel] = useState([]);
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 2 ? [...s, id] : s);
  return (
    <div style={{ padding: "40px 22px", maxWidth: 480, margin: "0 auto" }}>
      <FadeIn>
        <RentalSticker text="Step 1 of 4" color={C.stickerBlue} rotation={-1} />
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.text, marginTop: 14, letterSpacing: "0.04em", lineHeight: 1 }}>FRIDAY NIGHT.</h2>
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.amber, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 6 }}>NOTHING PLANNED.</h2>
        <p style={{ fontFamily: F.sans, fontSize: 14, color: C.textFaded, marginBottom: 24 }}>What are you reaching for? Pick one or two.</p>
      </FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {MOOD_OPTIONS.map((m, i) => (
          <FadeIn key={m.id} delay={70 + i * 45}>
            <button onClick={() => toggle(m.id)} style={{
              width: "100%", padding: "13px 16px", border: `1.5px solid ${sel.includes(m.id) ? C.amber : C.border}`,
              borderRadius: 6, background: sel.includes(m.id) ? C.amberSoft : C.card,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              transition: "all 0.2s ease",
            }}>
              <span style={{ fontSize: 22, width: 28, textAlign: "center" }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600, color: C.text }}>{m.label}</div>
                <div style={{ fontFamily: F.sans, fontSize: 12, color: C.textFaded }}>{m.sub}</div>
              </div>
              {sel.includes(m.id) && <span style={{ color: C.amber, fontSize: 14, fontWeight: 700 }}>✓</span>}
            </button>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={400}>
        <button onClick={onNext} disabled={!sel.length} style={{
          width: "100%", marginTop: 24, padding: "14px", borderRadius: 6, border: "none",
          background: sel.length ? C.amber : C.border, color: sel.length ? C.bg : C.textGhost,
          fontFamily: F.display, fontSize: 16, letterSpacing: "0.1em", cursor: sel.length ? "pointer" : "default",
        }}>CONTINUE</button>
      </FadeIn>
    </div>
  );
}

function OnboardingAnchors({ onNext }) {
  const [sel, setSel] = useState([]);
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <div style={{ padding: "40px 22px", maxWidth: 480, margin: "0 auto" }}>
      <FadeIn>
        <RentalSticker text="Step 2 of 4" color={C.stickerPink} rotation={1} />
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.text, marginTop: 14, letterSpacing: "0.04em", lineHeight: 1 }}>BROWSE</h2>
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.amber, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 6 }}>THE SHELVES.</h2>
        <p style={{ fontFamily: F.sans, fontSize: 14, color: C.textFaded, marginBottom: 24 }}>Tap anything you've watched or follow.</p>
      </FadeIn>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
        padding: "16px 12px", background: C.shelf, borderRadius: 8, border: `1px solid ${C.borderWorn}`,
        boxShadow: SHELF_SHADOW,
      }}>
        {TASTE_ANCHORS.map((t, i) => (
          <FadeIn key={t} delay={50 + i * 30}>
            <button onClick={() => toggle(t)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", position: "relative" }}>
              <VHSSpine title={t} size="md" selected={sel.includes(t)} />
              {sel.includes(t) && (
                <div style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.bg, fontWeight: 800, boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>✓</div>
              )}
            </button>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={550}>
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <button onClick={onNext} style={{ flex: 1, padding: "13px", borderRadius: 6, border: `1.5px solid ${C.border}`, background: "transparent", color: C.textFaded, fontFamily: F.sans, fontSize: 13, cursor: "pointer" }}>Skip</button>
          <button onClick={onNext} disabled={!sel.length} style={{ flex: 2, padding: "14px", borderRadius: 6, border: "none", background: sel.length ? C.amber : C.border, color: sel.length ? C.bg : C.textGhost, fontFamily: F.display, fontSize: 15, letterSpacing: "0.08em", cursor: sel.length ? "pointer" : "default" }}>{sel.length ? `PICKED ${sel.length}` : "SELECT SOME"}</button>
        </div>
      </FadeIn>
    </div>
  );
}

function OnboardingPlatforms({ onNext }) {
  const [sel, setSel] = useState([]);
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <div style={{ padding: "40px 22px", maxWidth: 480, margin: "0 auto" }}>
      <FadeIn>
        <RentalSticker text="Step 3 of 4" color={C.stickerYellow} rotation={-1} />
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.text, marginTop: 14, letterSpacing: "0.04em", lineHeight: 1 }}>YOUR</h2>
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.amber, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 6 }}>CHANNELS.</h2>
        <p style={{ fontFamily: F.sans, fontSize: 14, color: C.textFaded, marginBottom: 24 }}>Where do you watch? We'll set up sync for each.</p>
      </FadeIn>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
        {PLATFORMS.map((p, i) => (
          <FadeIn key={p.id} delay={70 + i * 35}>
            <button onClick={() => toggle(p.id)} style={{
              width: "100%", padding: "14px 12px", border: `1.5px solid ${sel.includes(p.id) ? C.amber : C.border}`,
              borderRadius: 6, background: sel.includes(p.id) ? C.amberSoft : C.card,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s ease",
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 800, fontFamily: F.sans }}>{p.name[0]}</div>
              <span style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</span>
              {sel.includes(p.id) && <span style={{ marginLeft: "auto", color: C.amber, fontSize: 13 }}>✓</span>}
            </button>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={400}>
        <button onClick={onNext} disabled={!sel.length} style={{
          width: "100%", marginTop: 24, padding: "14px", borderRadius: 6, border: "none",
          background: sel.length ? C.amber : C.border, color: sel.length ? C.bg : C.textGhost,
          fontFamily: F.display, fontSize: 16, letterSpacing: "0.1em", cursor: sel.length ? "pointer" : "default",
        }}>SET UP MY SYNC</button>
      </FadeIn>
    </div>
  );
}

function OnboardingSeed({ onNext }) {
  const titles = ["White Lotus", "Beef", "Shōgun", "3 Body Problem", "Veritasium", "The Last of Us", "Dune: Part Two", "Poker Face"];
  const [items, setItems] = useState(titles.map((t, i) => ({ id: i, title: t, status: null })));
  const setStatus = (id, st) => setItems(items.map(i => i.id === id ? { ...i, status: i.status === st ? null : st } : i));
  const tagged = items.filter(i => i.status);
  return (
    <div style={{ padding: "40px 22px", maxWidth: 480, margin: "0 auto" }}>
      <FadeIn>
        <RentalSticker text="Step 4 of 4" color={C.stickerBlue} rotation={1} />
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.text, marginTop: 14, letterSpacing: "0.04em", lineHeight: 1 }}>STAFF PICKS</h2>
        <h2 style={{ fontFamily: F.display, fontSize: 38, color: C.amber, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 6 }}>FOR YOU.</h2>
        <p style={{ fontFamily: F.sans, fontSize: 14, color: C.textFaded, marginBottom: 24 }}>We think you've seen these. Tag what fits.</p>
      </FadeIn>
      <div style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "14px 12px", background: C.shelf, borderRadius: 8,
        border: `1px solid ${C.borderWorn}`, boxShadow: SHELF_SHADOW,
      }}>
        {items.map((item, i) => (
          <FadeIn key={item.id} delay={50 + i * 40}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              background: C.card, borderRadius: 5, border: `1px solid ${C.borderWorn}`,
            }}>
              <VHSSpine title={item.title} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {[
                  { key: "watching", label: "📺", tip: "Watching" },
                  { key: "watched", label: "✓", tip: "Watched" },
                  { key: "skip", label: "✕", tip: "Nah" },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setStatus(item.id, opt.key)} title={opt.tip} style={{
                    width: 32, height: 32, borderRadius: 5, fontSize: 13,
                    border: `1.5px solid ${item.status === opt.key ? (opt.key === "skip" ? C.coral : opt.key === "watched" ? C.teal : C.amber) : C.border}`,
                    background: item.status === opt.key ? (opt.key === "skip" ? C.coralSoft : opt.key === "watched" ? C.tealSoft : C.amberSoft) : "transparent",
                    cursor: "pointer", transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={500}>
        <button onClick={onNext} style={{
          width: "100%", marginTop: 24, padding: "14px", borderRadius: 6, border: "none",
          background: C.amber, color: C.bg, fontFamily: F.display, fontSize: 16, letterSpacing: "0.1em", cursor: "pointer",
        }}>{tagged.length ? `START WITH ${tagged.length} LOGGED` : "START FRESH"}</button>
      </FadeIn>
    </div>
  );
}

function DailySync({ onComplete }) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState(SYNC_RESULTS.map(r => ({ ...r, accepted: true })));
  useEffect(() => { if (step === 1) { const t = setTimeout(() => setStep(2), 2800); return () => clearTimeout(t); } }, [step]);

  if (step === 0) return (
    <div style={{ padding: "44px 22px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <FadeIn>
        <RentalSticker text="Tonight's check-in" rotation={-2} />
        <h2 style={{ fontFamily: F.display, fontSize: 44, color: C.text, marginTop: 16, letterSpacing: "0.04em", lineHeight: 1 }}>WHAT DID YOU</h2>
        <h2 style={{ fontFamily: F.display, fontSize: 44, color: C.amber, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 10 }}>WATCH TODAY?</h2>
        <p style={{ fontFamily: F.serif, fontSize: 14, color: C.textFaded, fontStyle: "italic", lineHeight: 1.5, marginBottom: 28 }}>
          Screenshot your history from each app,<br />then bring them back here.
        </p>
      </FadeIn>
      <FadeIn delay={200}>
        <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {[{ n: "Netflix", c: "#E50914" }, { n: "Apple TV+", c: "#666" }, { n: "YouTube", c: "#FF0000" }].map(p => (
            <div key={p.n} style={{
              padding: "9px 14px", borderRadius: 6, border: `1.5px solid ${C.border}`,
              background: C.card, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: p.c, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: F.sans }}>{p.n[0]}</div>
              <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 500, color: C.text }}>{p.n}</span>
            </div>
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={350}>
        <button onClick={() => setStep(1)} style={{ width: "100%", padding: "14px", borderRadius: 6, border: "none", background: C.amber, color: C.bg, fontFamily: F.display, fontSize: 16, letterSpacing: "0.1em", cursor: "pointer" }}>I'VE GOT MY SCREENSHOTS</button>
        <button onClick={onComplete} style={{ width: "100%", marginTop: 8, padding: "12px", border: "none", background: "transparent", color: C.textGhost, fontFamily: F.sans, fontSize: 12, cursor: "pointer" }}>Skip today</button>
      </FadeIn>
    </div>
  );

  if (step === 1) return (
    <div style={{ padding: "70px 22px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <FadeIn>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.amber, margin: "0 auto 22px", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h3 style={{ fontFamily: F.display, fontSize: 18, color: C.text, letterSpacing: "0.08em", marginBottom: 10 }}>SCANNING YOUR SHELVES...</h3>
        <p style={{ fontFamily: F.serif, fontSize: 13, color: C.textFaded, fontStyle: "italic" }}>3 friends are watching the same show as you.</p>
      </FadeIn>
    </div>
  );

  return (
    <div style={{ padding: "36px 22px", maxWidth: 480, margin: "0 auto" }}>
      <FadeIn>
        <ShelfDivider label={`FOUND ${results.filter(r => r.accepted).length} NEW`} sub="tonight" />
      </FadeIn>
      <div style={{
        display: "flex", flexDirection: "column", gap: 7,
        padding: "12px 10px", background: C.shelf, borderRadius: 8,
        border: `1px solid ${C.borderWorn}`, boxShadow: SHELF_SHADOW,
      }}>
        {results.map((r, i) => (
          <FadeIn key={r.id} delay={70 + i * 60}>
            <div style={{
              padding: "12px 14px", background: C.card, borderRadius: 6,
              border: `1px solid ${r.accepted ? C.borderWorn : "rgba(212,119,107,0.3)"}`,
              opacity: r.accepted ? 1 : 0.35, transition: "all 0.3s ease",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <VHSSpine title={r.title} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.text }}>{r.title}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textFaded, marginTop: 2 }}>{r.episode} · {r.platform}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 5 }}>
                  {r.status === "new" ? <RentalSticker text="New rental" color={C.stickerYellow} rotation={0} /> : <RentalSticker text="Continuing" color={C.stickerBlue} rotation={0} />}
                  {r.confidence < 0.9 && <span style={{ fontFamily: F.mono, fontSize: 9, color: C.textGhost }}>⚠ verify</span>}
                </div>
              </div>
              <button onClick={() => setResults(results.map(x => x.id === r.id ? { ...x, accepted: !x.accepted } : x))} style={{
                width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: r.accepted ? C.textGhost : C.coral,
              }}>{r.accepted ? "×" : "↩"}</button>
            </div>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={300}>
        <div style={{ display: "flex", gap: 7, marginTop: 20 }}>
          <button style={{ flex: 1, padding: "12px", borderRadius: 6, border: `1.5px solid ${C.border}`, background: "transparent", color: C.textFaded, fontFamily: F.sans, fontSize: 12, cursor: "pointer" }}>Edit details</button>
          <button onClick={onComplete} style={{ flex: 2, padding: "12px", borderRadius: 6, border: "none", background: C.amber, color: C.bg, fontFamily: F.display, fontSize: 15, letterSpacing: "0.08em", cursor: "pointer" }}>LOOKS GOOD ✓</button>
        </div>
      </FadeIn>
    </div>
  );
}

function FeedView() {
  return (
    <div>
      <FadeIn>
        <div style={{
          padding: "16px 18px", background: C.card, borderRadius: 8,
          marginBottom: 18, border: `1px solid ${C.border}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 8, right: 10 }}><RentalSticker text="This week" color={C.stickerBlue} rotation={3} /></div>
          <div style={{ fontFamily: F.display, fontSize: 36, color: C.text, letterSpacing: "0.04em", lineHeight: 1 }}>14 HOURS</div>
          <div style={{ fontFamily: F.serif, fontSize: 13, color: C.textFaded, fontStyle: "italic", marginTop: 8, lineHeight: 1.5 }}>
            4 of those were friend-recommended. That's the good stuff.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>3</span> shows from friends
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost }}>
              <span style={{ color: C.teal, fontWeight: 700 }}>2</span> shared watches
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={80}>
        <ShelfDivider label="STAFF PICKS" sub="from your friends" />
      </FadeIn>

      {FRIENDS.map((a, i) => (
        <FadeIn key={a.id} delay={180 + i * 80}>
          <div style={{
            padding: "14px 16px", background: C.card, borderRadius: 8,
            border: `1px solid ${C.borderWorn}`, marginBottom: 8,
            position: "relative",
          }}>
            {/* Sticker accent */}
            <div style={{ position: "absolute", top: -4, right: 12 }}>
              <RentalSticker text={a.action === "finished" ? "Returned ✓" : a.action === "started" ? "Just rented" : a.hasClip ? "With clip" : "Reviewed"} color={C[a.sticker]} rotation={a.id % 2 === 0 ? 2 : -2} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, marginTop: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C[a.sticker]}, ${C[a.sticker]}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#fff",
              }}>{a.initial}</div>
              <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.text }}>{a.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 10, color: C.textGhost }}>{a.time}</span>
            </div>

            <div style={{ fontFamily: F.display, fontSize: 22, color: C.text, letterSpacing: "0.04em", marginBottom: 4 }}>{a.show}</div>

            {a.take && (
              <p style={{ fontFamily: F.serif, fontSize: 13, color: C.textWorn, lineHeight: 1.6, margin: "6px 0 0", fontStyle: "italic" }}>"{a.take}"</p>
            )}

            {a.rating && (
              <div style={{ marginTop: 8 }}>
                <ReturnStamp text={`${a.rating}/10`} />
              </div>
            )}

            {a.hasClip && (
              <div style={{
                marginTop: 10, padding: "10px 12px", background: C.shelf, borderRadius: 6,
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                border: `1px solid ${C.borderWorn}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 6, background: C.amberSoft, border: `1.5px solid ${C.amberDim}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.amber,
                }}>▶</div>
                <div>
                  <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: C.text }}>10s preview</div>
                  <div style={{ fontFamily: F.mono, fontSize: 9, color: C.textGhost }}>tap to watch the moment</div>
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      ))}

      <FadeIn delay={600}>
        <div style={{
          textAlign: "center", padding: "24px 16px", marginTop: 8,
          borderTop: `1px solid ${C.borderWorn}`,
        }}>
          <p style={{ fontFamily: F.serif, fontSize: 13, color: C.textGhost, fontStyle: "italic" }}>
            Be kind. Rewind. Come back tomorrow.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

function LogView() {
  const [view, setView] = useState("shelf");
  const watching = MOCK_SHOWS.filter(s => s.status === "watching");
  const watched = MOCK_SHOWS.filter(s => s.status === "watched");

  return (
    <div>
      <FadeIn>
        <div style={{ display: "flex", gap: 3, marginBottom: 20, background: C.card, borderRadius: 5, padding: 3, border: `1px solid ${C.border}` }}>
          {["shelf", "list", "stats"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              flex: 1, padding: "7px 0", borderRadius: 4, border: "none",
              background: view === v ? C.amber : "transparent",
              color: view === v ? C.bg : C.textFaded,
              fontFamily: F.display, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer",
              transition: "all 0.15s ease", textTransform: "uppercase",
            }}>{v}</button>
          ))}
        </div>
      </FadeIn>

      {view === "stats" ? (
        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              { label: "HOURS THIS MONTH", value: "62", sub: "↓ 8% from last month", color: C.stickerBlue },
              { label: "TITLES TRACKED", value: "23", sub: "4 now playing", color: C.stickerYellow },
              { label: "FRIEND RECS", value: "7/12", sub: "watched from friends", color: C.stickerPink },
              { label: "TOP GENRE", value: "Drama", sub: "then Sci-Fi", color: C.stickerYellow },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "14px", background: C.card, borderRadius: 6,
                border: `1px solid ${C.borderWorn}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 6, right: 6 }}><RentalSticker text={s.label} color={s.color} rotation={i % 2 ? 2 : -1} /></div>
                <div style={{ fontFamily: F.display, fontSize: 36, color: C.text, marginTop: 18 }}>{s.value}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      ) : view === "shelf" ? (
        <>
          {watching.length > 0 && (
            <FadeIn>
              <ShelfDivider label="NOW PLAYING" sub={`${watching.length} titles`} />
              <div style={{
                display: "flex", gap: 10, overflowX: "auto", paddingBottom: 14, marginBottom: 20,
                padding: "14px 12px", background: C.shelf, borderRadius: 8,
                border: `1px solid ${C.borderWorn}`, boxShadow: SHELF_SHADOW,
                scrollbarWidth: "none",
              }}>
                {watching.map(s => (
                  <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 5, cursor: "pointer" }}>
                    <VHSSpine title={s.title} size="lg">
                      {s.progress && (
                        <div style={{ marginTop: 4, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                          <div style={{ width: `${s.progress}%`, height: "100%", background: C.amber, borderRadius: 1 }} />
                        </div>
                      )}
                    </VHSSpine>
                    {s.episode && <div style={{ fontFamily: F.mono, fontSize: 9, color: C.textGhost, textAlign: "center" }}>{s.episode}</div>}
                  </div>
                ))}
              </div>
            </FadeIn>
          )}
          {watched.length > 0 && (
            <FadeIn delay={120}>
              <ShelfDivider label="RECENTLY RETURNED" sub={`${watched.length} titles`} />
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
                padding: "14px 12px", background: C.shelf, borderRadius: 8,
                border: `1px solid ${C.borderWorn}`, boxShadow: SHELF_SHADOW,
              }}>
                {watched.map(s => (
                  <div key={s.id} style={{ cursor: "pointer" }}>
                    <VHSSpine title={s.title} size="md">
                      {s.rating && <div style={{ fontFamily: F.display, fontSize: 14, color: C.amber, marginTop: 2 }}>{s.rating}<span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)" }}>/10</span></div>}
                    </VHSSpine>
                  </div>
                ))}
              </div>
            </FadeIn>
          )}
        </>
      ) : (
        <FadeIn>
          {[...watching, ...watched].map(s => (
            <div key={s.id} style={{
              padding: "10px 12px", background: C.card, borderRadius: 6,
              border: `1px solid ${C.borderWorn}`, marginBottom: 5,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <VHSSpine title={s.title} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.text }}>{s.title}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost }}>{s.platform} · {s.genre}{s.episode ? ` · ${s.episode}` : ""}</div>
              </div>
              {s.rating ? <ReturnStamp text={`${s.rating}/10`} /> : s.status === "watching" ? <RentalSticker text="Playing" color={C.stickerBlue} rotation={0} /> : null}
            </div>
          ))}
        </FadeIn>
      )}
    </div>
  );
}

export default function StaffPicks() {
  const [screen, setScreen] = useState("welcome");
  const [tab, setTab] = useState("today");
  const [synced, setSynced] = useState(false);

  const tabs = [
    { id: "today", label: "Today", icon: "◉" },
    { id: "search", label: "Search", icon: "⌕" },
    { id: "log", label: "Shelf", icon: "▤" },
    { id: "queue", label: "Queue", icon: "◎" },
    { id: "me", label: "Me", icon: "○" },
  ];

  const fontLink = <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />;
  const overlay = <>
    <div style={{ position: "fixed", inset: 0, backgroundImage: GRAIN, backgroundRepeat: "repeat", pointerEvents: "none", zIndex: 9998, mixBlendMode: "overlay" }} />
    <div style={{ position: "fixed", inset: 0, background: SCANLINES, pointerEvents: "none", zIndex: 9999, opacity: 0.4 }} />
  </>;

  if (screen === "welcome") return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {fontLink}{overlay}
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, background: `radial-gradient(circle, ${C.amberGlow} 0%, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ padding: "60px 28px", textAlign: "center", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <FadeIn>
          <div style={{ marginBottom: 20 }}>
            <RentalSticker text="Now open" color={C.stickerYellow} rotation={-3} />
          </div>
          <div style={{ fontFamily: F.display, fontSize: 60, color: C.text, letterSpacing: "0.08em", lineHeight: 1 }}>STAFFPICKS</div>
          <div style={{ width: 50, height: 2, background: C.amber, margin: "14px auto 18px" }} />
          <p style={{ fontFamily: F.serif, fontSize: 15, color: C.textFaded, lineHeight: 1.7, fontStyle: "italic" }}>
            Your friends work here.<br />
            Their picks are always better than the algorithm.
          </p>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost, marginTop: 12, letterSpacing: "0.06em" }}>
            BE KIND, REWIND
          </div>
        </FadeIn>
        <FadeIn delay={300}>
          <button onClick={() => setScreen("ob1")} style={{ width: "100%", marginTop: 32, padding: "15px", borderRadius: 6, border: "none", background: C.amber, color: C.bg, fontFamily: F.display, fontSize: 18, letterSpacing: "0.12em", cursor: "pointer" }}>GET STARTED</button>
          <button onClick={() => { setScreen("app"); setSynced(true); }} style={{ width: "100%", marginTop: 8, padding: "13px", border: "none", background: "transparent", color: C.textGhost, fontFamily: F.sans, fontSize: 12, cursor: "pointer" }}>I already have a membership</button>
        </FadeIn>
      </div>
    </div>
  );

  if (screen.startsWith("ob")) return (
    <div style={{ minHeight: "100vh", background: C.bg, position: "relative" }}>
      {fontLink}{overlay}
      {screen === "ob1" && <OnboardingMood onNext={() => setScreen("ob2")} />}
      {screen === "ob2" && <OnboardingAnchors onNext={() => setScreen("ob3")} />}
      {screen === "ob3" && <OnboardingPlatforms onNext={() => setScreen("ob4")} />}
      {screen === "ob4" && <OnboardingSeed onNext={() => setScreen("app")} />}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans, position: "relative" }}>
      {fontLink}{overlay}
      <div style={{
        padding: "12px 18px 8px", background: `${C.bg}F2`,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: F.display, fontSize: 22, color: C.text, letterSpacing: "0.08em" }}>STAFFPICKS</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: C.textGhost }}>MEMBER</div>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: C.bg }}>A</div>
        </div>
      </div>

      <div style={{ padding: "18px 16px 100px", maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {tab === "today" && !synced && <DailySync onComplete={() => setSynced(true)} />}
        {tab === "today" && synced && <FeedView />}
        {tab === "log" && <LogView />}
        {tab === "search" && (
          <FadeIn>
            <div style={{ padding: "12px 14px", background: C.card, borderRadius: 6, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: C.textGhost, fontSize: 15 }}>⌕</span>
              <span style={{ color: C.textGhost, fontFamily: F.sans, fontSize: 13 }}>Search movies, shows, channels...</span>
            </div>
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <div style={{ fontFamily: F.display, fontSize: 16, color: C.textGhost, letterSpacing: "0.1em" }}>BROWSE THE COLLECTION</div>
              <p style={{ fontFamily: F.serif, fontSize: 12, color: C.textGhost, fontStyle: "italic", marginTop: 6 }}>Find anything to add it to your shelf.</p>
            </div>
          </FadeIn>
        )}
        {tab === "queue" && (
          <FadeIn>
            <ShelfDivider label="UP NEXT" sub="your queue" />
            <div style={{
              padding: "12px 10px", background: C.shelf, borderRadius: 8,
              border: `1px solid ${C.borderWorn}`, boxShadow: SHELF_SHADOW,
            }}>
              {[
                { title: "Ripley", platform: "Netflix", from: "Sarah recommended" },
                { title: "Fallout", platform: "Prime Video", from: "From your feed" },
                { title: "Civil War", platform: "Theaters", from: "You queued this" },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 60}>
                  <div style={{
                    padding: "10px 12px", background: C.card, borderRadius: 5,
                    border: `1px solid ${C.borderWorn}`, marginBottom: 6,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <VHSSpine title={item.title} size="sm" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.text }}>{item.title}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost }}>{item.platform} · {item.from}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        )}
        {tab === "me" && (
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", background: C.amber,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px",
                fontFamily: F.display, fontSize: 26, color: C.bg,
              }}>A</div>
              <div style={{ fontFamily: F.display, fontSize: 30, color: C.text, letterSpacing: "0.06em" }}>ANDREW</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textGhost, marginTop: 4, letterSpacing: "0.06em" }}>MEMBER SINCE 2026</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
                {[{ v: "127", l: "logged" }, { v: "34", l: "friends" }, { v: "4", l: "playing" }].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: F.display, fontSize: 24, color: C.text }}>{s.v}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 9, color: C.textGhost, letterSpacing: "0.06em" }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "16px 16px", background: C.card, borderRadius: 8, border: `1px solid ${C.borderWorn}`, marginBottom: 10, position: "relative" }}>
              <div style={{ position: "absolute", top: -6, right: 12 }}><RentalSticker text="This week" color={C.stickerBlue} rotation={2} /></div>
              <div style={{ fontFamily: F.serif, fontSize: 13, color: C.textWorn, lineHeight: 1.6, fontStyle: "italic", marginTop: 8 }}>
                You watched 3 shows that friends recommended this week. Your crew has good taste.
              </div>
            </div>

            <div style={{ padding: "16px 16px", background: C.card, borderRadius: 8, border: `1px solid ${C.borderWorn}`, position: "relative" }}>
              <div style={{ position: "absolute", top: -6, right: 12 }}><RentalSticker text="Taste match" color={C.stickerPink} rotation={-2} /></div>
              <div style={{ fontFamily: F.sans, fontSize: 12, color: C.textWorn, lineHeight: 1.5, marginTop: 8 }}>
                You and <span style={{ color: C.text, fontWeight: 600 }}>Sarah M.</span> agree 84% of the time. Check her shelf.
              </div>
            </div>
          </FadeIn>
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: `${C.bg}F5`, borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-around", padding: "6px 0 20px",
        maxWidth: 480, margin: "0 auto", backdropFilter: "blur(12px)", zIndex: 100,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 17, color: tab === t.id ? C.amber : C.textGhost, transition: "color 0.2s ease" }}>{t.icon}</span>
            <span style={{ fontFamily: F.display, fontSize: 9, letterSpacing: "0.1em", color: tab === t.id ? C.amber : C.textGhost, transition: "color 0.2s ease" }}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
