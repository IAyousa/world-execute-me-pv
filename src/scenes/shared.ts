import { Grid, Palette, PHOSPHOR } from '../engine/grid';
import { hash } from '../engine/rng';
import { commentBlock } from '../engine/deco';

export interface Scene {
  draw: (g: Grid, t: number, f: number) => void;
  overlay?: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, f: number) => void;
  collapse?: (t: number) => { sy: number; lineGlow: number; lineW: number };
}

/** typed lyric comment line; brightness steps down as it ages (cross-dissolve) */
export function typeLine(g: Grid, x: number, y: number, text: string, t: number, t0: number, cps = 24, te?: number): void {
  if (t < t0) return;
  const age = t - t0;
  // te = when the line finishes being sung (from WINDOWS): hold bright
  // through the sung window, then mid 2s, then dim; without te the fixed
  // 3s/5s tiers apply. Never demote before typing could even finish.
  const brightUntil = te !== undefined
    ? Math.max(te, t0 + text.length / cps)
    : t0 + 3.0;
  const ci = t < brightUntil ? 3 : t < brightUntil + 2.0 ? 2 : 1;
  commentBlock(g, x, y, text, Math.floor(age * cps), ci);
}

/** render an ascii-art bitmap */
export function bitmap(g: Grid, art: string[], x: number, y: number, ci = 3): void {
  art.forEach((ln, r) => g.puts(x, y + r, ln, ci));
}

/** bitmap whose cells converge from scattered positions (字生图 gather) */
export function convergeBitmap(g: Grid, art: string[], x: number, y: number, t: number, t0: number, ci = 3): void {
  const k = Math.min(1, Math.max(0, (t - t0) / 0.9));
  // rows of differing widths center on the widest row — left-aligned
  // packing made ragged-edge art (emoji rasters) lean left
  const w = Math.max(...art.map(ln => ln.length));
  let idx = 0;
  art.forEach((ln, r) => {
    const off = Math.floor((w - ln.length) / 2);
    for (let c = 0; c < ln.length; c++, idx++) {
      const ch = ln[c];
      if (ch === ' ') continue;
      const jx = (hash(idx, 11) - 0.5) * 16 * (1 - k);
      const jy = (hash(idx, 12) - 0.5) * 10 * (1 - k);
      g.put(Math.round(x + off + c + jx), Math.round(y + r + jy), ch, k < 1 ? 2 : ci);
    }
  });
}

/** me: the little character-block protagonist */
export function meBlock(g: Grid, x: number, y: number, ci = 4): void {
  g.puts(x, y, '▓▓▓', ci);
  g.puts(x, y + 1, '▓▓▓', ci);
  g.puts(x, y + 2, '▓▓▓', ci);
  g.puts(x, y + 3, 'me', Math.max(1, ci - 2));
}

/** you: the cursor-spectator */
export function youMark(g: Grid, x: number, y: number, ci = 4): void {
  g.put(x, y, '▮', ci);
  g.puts(x - 1, y + 1, 'you', Math.max(1, ci - 2));
}

const AMBER = { dim: '#5f4919', mid: '#a98527', main: '#c8a84b', bright: '#ffd98c' };

function mixHex(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
  const gg = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
  const bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
  return `#${((r << 16) | (gg << 8) | bl).toString(16).padStart(6, '0')}`;
}

/** phosphor green mixed toward amber by k (官能线升温) */
export function warmPal(k: number): Palette {
  if (k <= 0.002) return PHOSPHOR;
  return {
    bg: PHOSPHOR.bg,
    dim: mixHex(PHOSPHOR.dim, AMBER.dim, k),
    mid: mixHex(PHOSPHOR.mid, AMBER.mid, k),
    main: mixHex(PHOSPHOR.main, AMBER.main, k),
    bright: mixHex(PHOSPHOR.bright, AMBER.bright, k),
    accent: PHOSPHOR.accent,
  };
}

export function clamp01(v: number): number { return Math.min(1, Math.max(0, v)); }

export function ease(v: number): number { return clamp01(v) * clamp01(v) * (3 - 2 * clamp01(v)); }

/** dotted coordinate axes */
export function axes(g: Grid, cx: number, cy: number, halfW: number, halfH: number, ci = 1): void {
  for (let x = cx - halfW; x <= cx + halfW; x++) {
    if (x % 2 === 0) g.put(x, cy, x === cx + halfW ? '▸' : '·', ci);
  }
  for (let y = cy - halfH; y <= cy + halfH; y++) {
    if (y % 2 === 0) g.put(cx, y, y === cy - halfH ? '▴' : '·', ci);
  }
  g.put(cx, cy, '+', ci + 1);
}

/** events at/before t within span, newest first */
export function recent(times: number[], t: number, span: number): number[] {
  const out: number[] = [];
  for (let i = times.length - 1; i >= 0; i--) {
    if (times[i] < t - span) break;
    if (times[i] <= t) out.push(times[i]);
  }
  return out;
}

/** expanding character rings spawned by pulse events */
export function pulseRings(g: Grid, cx: number, cy: number, t: number, times: number[], speed = 24, squash = 0.55): void {
  for (const t0 of times) {
    const age = t - t0;
    if (age < 0 || age > 2.2) continue;
    const r = 2 + age * speed;
    const ch = age < 0.25 ? '·' : age < 0.8 ? ':' : age < 1.4 ? '*' : '·';
    const ci = age < 0.3 ? 4 : age < 1.0 ? 3 : 2;
    const n = 56;
    for (let a = 0; a < n; a++) {
      const th = (a / n) * Math.PI * 2;
      g.put(Math.round(cx + Math.cos(th) * r), Math.round(cy + Math.sin(th) * r * squash), ch, ci);
    }
  }
}

/** expanding ripple of a repeated glyph (purr waves, etc.) */
export function ripple(g: Grid, cx: number, cy: number, age: number, glyph: string, maxR = 18, squash = 0.6): void {
  if (age < 0 || age > 2.4) return;
  const r = 1 + age * (maxR / 1.6);
  const n = 28;
  const ci = age < 0.3 ? 4 : age < 1.2 ? 3 : 2;
  for (let a = 0; a < n; a++) {
    const th = (a / n) * Math.PI * 2;
    g.put(Math.round(cx + Math.cos(th) * r), Math.round(cy + Math.sin(th) * r * squash), glyph, ci);
  }
}

/** the far tiny idle donut (world spinning in the background) */
export function idleDonut(g: Grid, t: number, cx: number, cy: number, halfW: number): void {
  // drawn as a simple char ring to stay cheap
  const n = 40;
  for (let a = 0; a < n; a++) {
    const th = (a / n) * Math.PI * 2 + t * 0.4;
    const wobble = 1 + Math.sin(t * 1.3 + th * 2) * 0.06;
    const x = Math.round(cx + Math.cos(th) * halfW * wobble);
    const y = Math.round(cy + Math.sin(th) * halfW * 0.5 * wobble);
    g.put(x, y, a % 7 === 0 ? '*' : '·', a % 7 === 0 ? 2 : 1);
  }
}
