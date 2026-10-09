/* ==========================================================================
   THE ONLY PLACE A COVER IS PRODUCED.

   Ported from getCover() in js/kzd-blog.js. The maths is unchanged — same
   FNV-1a hash, same Mulberry32 PRNG, same six palettes — so a post keeps the
   cover it already had. What changed is where it runs: the static site built
   these with document.createElementNS after first paint, which meant no cover
   in the HTML a crawler receives. This is a Server Component, so the SVG is in
   the served markup.

   Deterministic from the slug, so nothing has to be stored and the same post
   always renders the same image.

   Swapping this for a real image later — an uploaded file from Payload, a
   stock photo — means returning an <Image> from this component. No caller
   inspects what comes back, so nothing else changes.
   ========================================================================== */

type Palette = { name: string; from: string; to: string };

const PALETTES: Palette[] = [
  { name: "navy deep", from: "var(--kzd-navy-700)", to: "var(--kzd-navy-400)" },
  { name: "navy mid", from: "var(--kzd-navy-600)", to: "var(--kzd-navy-300)" },
  { name: "black", from: "var(--kzd-black)", to: "var(--kzd-charcoal)" },
  { name: "navy to gray", from: "var(--kzd-navy-500)", to: "var(--kzd-gray)" },
  { name: "charcoal navy", from: "var(--kzd-charcoal)", to: "var(--kzd-navy-400)" },
  { name: "navy long", from: "var(--kzd-navy-700)", to: "var(--kzd-navy-300)" },
];

/** FNV-1a. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — small, deterministic, seeded from the slug. */
function prng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 800;
const H = 500;

export default function Cover({
  seed,
  title,
  className,
  priority = false,
}: {
  seed: string;
  title: string;
  className?: string;
  /** Covers below the fold are decorative to a screen reader that has already
      read the heading; the lead cover on an article is the one worth labelling. */
  priority?: boolean;
}) {
  const h = hash(seed);
  const rand = prng(h);
  const pal = PALETTES[h % PALETTES.length];
  const gid = `kzdg-${h.toString(36)}`;

  const circles = Array.from({ length: 4 + Math.floor(rand() * 3) }, () => ({
    cx: +(rand() * W).toFixed(1),
    cy: +(rand() * H).toFixed(1),
    r: +(110 + rand() * 190).toFixed(1),
    o: +(0.04 + rand() * 0.06).toFixed(3),
  }));

  const lines = Array.from({ length: 5 + Math.floor(rand() * 5) }, () => {
    const x1 = rand() * W;
    const y1 = rand() * H;
    const len = 180 + rand() * 420;
    const slope = -0.35 + rand() * 0.7;
    return {
      x1: +x1.toFixed(1),
      y1: +y1.toFixed(1),
      x2: +(x1 + len).toFixed(1),
      y2: +(y1 + len * slope).toFixed(1),
      o: +(0.1 + rand() * 0.18).toFixed(3),
      w: +(0.8 + rand() * 1.1).toFixed(2),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      {...(priority
        ? { role: "img", "aria-label": `Abstract cover illustration for “${title}”` }
        : { "aria-hidden": true, focusable: false })}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: pal.from }} />
          <stop offset="1" style={{ stopColor: pal.to }} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${gid})`} />
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} style={{ fill: "var(--kzd-white)" }} fillOpacity={c.o} />
      ))}
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          style={{ stroke: "var(--kzd-white)" }}
          strokeOpacity={l.o}
          strokeWidth={l.w}
        />
      ))}
    </svg>
  );
}
