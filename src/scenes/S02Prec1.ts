import { Grid } from '../engine/grid';
import { typeLine, ease, clamp01 } from './shared';
import { BEAT } from '../engine/song';
import { T, WINDOWS } from '../timeline';

const L = [
  'Switch my current to AC to DC',
  'And then blind my vision, so dizzy so dizzy',
  'Oh we can travel to A.D to B.C',
  'And we can unite, so deeply so deeply',
];

/** S02 · 44.45–59.22 · PRE-CHORUS 1 — scope trace, dizzy blur, timeline drag, double helix */
export const draw = (g: Grid, t: number): void => {
  L.forEach((ln, i) => typeLine(g, 6, 3 + i * 2, ln, t, T.prec1[i], 24, WINDOWS.prec1[i][1]));

  if (t < T.prec1[1]) {
    drawScope(g, t);          // PC1-L1 · unit B
  } else if (t < T.prec1[2]) {
    drawDizzy(g, t);          // PC1-L2 · unit C
  } else if (t < T.prec1[3]) {
    drawTimeline(g, t);       // PC1-L3 · unit D
  } else {
    drawHelix(g, t);          // PC1-L4 · unit E
  }
};

/** trace zone geometry shared by L1 and its frozen tail in L2 */
function traceZone(g: Grid): { x0: number; x1: number; ty: number; amp: number } {
  const x0 = Math.round(g.cols * 0.125);
  return { x0, x1: g.cols - 1 - x0, ty: Math.round(g.rows * 0.44), amp: Math.max(3, Math.round(g.rows * 0.1)) };
}

// ── PC1-L1 · unit B — one sweeping scope trace; the signal itself changes ──
// A single bright beam sweeps left→right on a 2-beat loop, writing whatever the
// signal is NOW: sine until "to D.C" is sung (T.prec1[0]+2.40, the word-group
// onset ≈46.85 — NOT the earlier "to A.C"), a line lying on
// the 0V baseline after. Older phosphor dims ~0.5s, then extinguishes — the
// afterglow is drawn as repeated dim characters, never a bitmap glow.
function drawScope(g: Grid, t: number): void {
  const { x0, x1, ty, amp } = traceZone(g);
  const t0 = T.prec1[0];
  const tSw = t0 + 2.40;                   // "to D.C" onsets ≈46.85 → signal flips
  const sweepDur = BEAT * 2;               // one sweep per two beats
  const lam = 11;                          // AC wavelength in columns
  const BRIGHT = 0.5, DIM = 0.5;           // fresh phosphor / afterglow windows

  for (let x = x0; x <= x1; x++) g.put(x, ty, '·', 1);   // 0V reference

  const u = (t - t0) / sweepDur;
  if (u < 0) return;
  const pass = Math.floor(u);
  const head = x0 + (u - pass) * (x1 - x0);
  for (let x = x0; x <= x1; x++) {
    let tw = t0 + (pass + (x - x0) / (x1 - x0)) * sweepDur;  // beam last wrote x at tw
    if (x > head) tw -= sweepDur;
    if (tw < t0) continue;                 // never written yet — nothing to show
    const age = t - tw;
    let ci: number;
    if (age < 0.09) ci = 4;                // the beam head itself, instantaneous
    else if (age < BRIGHT) ci = 3;         // fresh phosphor
    else if (age < BRIGHT + DIM) ci = 1;   // afterglow remnant
    else continue;                         // extinguished
    if (tw < tSw) {
      g.put(x, ty - Math.round(amp * Math.sin(((x - x0) / lam) * Math.PI * 2 + tw * 1.2)), '~', ci);
    } else {
      g.put(x, ty, '─', ci);               // DC: the trace lies on 0V
    }
  }

  // mode selector hung under the trace zone: a two-line menu whose text is
  // FIXED (To / A.C up, D.C down). The '>' is a cursor — it marks the live
  // row and leaves a blank placeholder on the other row (column-stable).
  // At "to DC" (tSw) the cursor steps down from A.C to D.C; the menu text
  // itself never swaps. Booting…→done. vocabulary kept for the switch.
  const sx = x0 + 2, sy = ty + amp + 3;
  const cur = t < tSw ? 0 : 1;
  g.puts(sx, sy, `To ${cur === 0 ? '>' : ' '} A.C`, cur === 0 ? 3 : 1);
  g.puts(sx, sy + 1, `   ${cur === 1 ? '>' : ' '} D.C`, cur === 1 ? 3 : 1);
  if (cur === 1) {
    const k = clamp01((t - tSw) / 0.4);    // ~0.4s of switch progress
    if (k < 1) {
      const n = Math.round(ease(k) * 10);
      g.puts(sx, sy + 2, `Booting… [${'·'.repeat(n)}${' '.repeat(10 - n)}]`, 2);
    } else if (t - tSw < 1.2) {
      g.puts(sx, sy + 2, 'done.', 3);
    }
  }
}

// ── PC1-L2 · unit C — blindfolded: the whole picture layer multiplies ──
// The L1 tail state (flat trace only — the selector menu is NOT carried
// over; its cursor must not survive L1) plus the spaced "so dizzy" card is
// composed into an off-screen buffer, then redrawn at 2 ghost offsets with
// falling brightness. The lyric comment block never enters the blur.
function drawDizzy(g: Grid, t: number): void {
  const t0 = T.prec1[1], t1 = T.prec1[2];
  const { x0, x1, ty } = traceZone(g);

  const p = new Grid(g.cols, g.rows);
  for (let x = x0; x <= x1; x++) p.put(x, ty, '─', 2);   // frozen DC tail
  p.puts(Math.round(g.cols / 2) - 7, Math.round(g.rows * 0.29), 's o   d i z z y', 2);

  // vertigo envelope: ~1 cell → ~3 cells at the line's peak → recede for the cut
  const tPk = t0 + 1.83, tFall = t1 - 0.36;
  let e: number;
  if (t < tPk) e = 1 + 2 * ease(clamp01((t - t0) / (tPk - t0)));
  else if (t < tFall) e = 3 - 2 * ease(clamp01((t - tPk) / (tFall - tPk)));
  else e = 1 - 0.5 * ease(clamp01((t - tFall) / (t1 - tFall)));
  const a = Math.max(1, Math.round(e));
  const ghosts: [number, number, number][] = [
    [Math.round(a * Math.sin(t * 1.1)), Math.round(1 + a * 0.35 * Math.sin(t * 0.8)), 1],
    [Math.round(a * 0.75 * Math.cos(t * 0.9)), -Math.round(1 + a * 0.3 * Math.cos(t * 1.3)), 2],
  ];
  for (const [dx, dy, drop] of ghosts) {
    for (let y = 0; y < p.rows; y++) {
      for (let x = 0; x < p.cols; x++) {
        const i = y * p.cols + x;
        if (p.ch[i] === ' ') continue;
        g.put(x + dx, y + dy, p.ch[i], Math.max(1, p.col[i] - drop));
      }
    }
  }
  for (let y = 0; y < p.rows; y++) {
    for (let x = 0; x < p.cols; x++) {
      const i = y * p.cols + x;
      if (p.ch[i] === ' ') continue;
      g.put(x, y, p.ch[i], p.col[i]);      // base copy last, full brightness
    }
  }
}

// ── PC1-L3 · unit D — a playhead hauled across three stations: Now → A.D → B.C ──
// One axis line, three stations only: 617 / 2026 / 2077 on the line, year
// labels ABOVE it, era names (B.C / Now / A.D) BELOW — the lyric's literal
// route. The head PARKS at Now until the lyric itself says go: it departs
// on the "to" of "to A.D" (t0+1.26 ≈52.62 — the same construction as the
// haul-back's "to"; "Oh we can travel" is only talk, the journey has not
// begun), reaches A.D 2077 on the "D" of "to A.D" (t0+1.95 ≈53.31 —
// arrival on the last syllable's onset, the B.C convention), dwells
// there, is hauled
// back on the "to" of "to B.C" (t0+2.18 ≈53.54), lands on B.C 617 at its
// "C" (t0+2.87 ≈54.23) and rests there to the cut; the motion eases with
// a periodic stall — hauled, not played, and clamped so the head always
// stays BETWEEN stations (reaches them exactly, never overshoots).
// Reaching a station lifts that
// station's labels one step for ≤0.5s. Now is the departure station: it
// starts SILENT (a lift is a reaching event, and Now is never reached
// inside this window). 617 is a
// permanent station on the axis (no separate flash), and there is no other
// furniture: no tick ruler, no wake residue. No hand drawn.
function drawTimeline(g: Grid, t: number): void {
  const t0 = T.prec1[2];
  const tDep = t0 + 1.26;                   // head departs Now ("to" of "to A.D" ≈52.62)
  const tAd = t0 + 1.95;                    // head reaches A.D 2077 ("D" ≈53.31)
  const tR0 = t0 + 2.18;                    // haul-back departs ("to" ≈53.54)
  const tBc = t0 + 2.87;                    // head lands on B.C 617 ("C" ≈54.23)
  const xL = Math.round(g.cols * 0.1);
  const xR = g.cols - 1 - xL;
  const xNow = Math.round((xL + xR) / 2);
  const ay = Math.round(g.rows * 0.47);
  const yy = ay - 2, ny = ay + 2;           // year row above / era row below

  // hauled motion: eased, with a periodic stall that fades near the ends.
  // clamp01 keeps the stall term from dipping progress below 0 at leg start
  // (the old overshoot: the head bulged PAST a station, e.g. right of A.D).
  const drag = (dt: number, dur: number): number => {
    const raw = clamp01(dt / dur);
    return clamp01(ease(raw) - 0.02 * Math.sin(raw * Math.PI * 10) * (1 - raw));
  };
  let ph: number;
  if (t <= tDep) ph = xNow;                                          // parked at Now — talk, not travel
  else if (t <= tAd) ph = xNow + drag(t - tDep, tAd - tDep) * (xR - xNow);   // Now → A.D, sung
  else if (t <= tR0) ph = xR;                                       // dwell at A.D
  else ph = xR - drag(t - tR0, tBc - tR0) * (xR - xL);              // A.D → B.C, then rest
  const px = Math.round(ph);

  for (let x = xL; x <= xR; x++) g.put(x, ay, '─', 1);

  const stations: [number, string, string, number | null][] = [
    [xL, '617', 'B.C', tBc],
    [xNow, '2026', 'Now', null],   // departure station: starts silent — no arrival event in this window
    [xR, '2077', 'A.D', tAd],
  ];
  for (const [x, yr, nm, ta] of stations) {
    const lit = ta !== null && t >= ta && t < ta + 0.5 ? 1 : 0;   // arrival: labels lift one step
    g.put(x, ay, '┼', 2 + lit);
    g.puts(x - Math.floor(yr.length / 2), yy, yr, 2 + lit);
    g.puts(x - Math.floor(nm.length / 2), ny, nm, 2 + lit);
  }

  for (let y = ay - 1; y <= ay + 1; y++) g.put(px, y, '▌', 3);   // the playhead
}

// ── PC1-L4 · unit E — me and you wind into one double helix ──
// Two bead strands (letters me / letters you) wind around the center axis,
// joined by '-'/'=' rungs. It turns ~half a turn across the sung line; at
// "so deeply" (T.prec1[3]+1.83) the pitch tightens one notch and holds.
// Both ends carry an H-shaped cap built from the SAME me/you letters (never
// raw '='/'│' furniture): a 'meyou' letter ladder crossing both strands,
// flanked by one-letter verticals (me side m/e, you side y/o) a row either
// side — the terminal base pair spelt in the helix's own alphabet.
function drawHelix(g: Grid, t: number): void {
  const t0 = T.prec1[3];
  const len = WINDOWS.prec1[3][1] - t0;    // the sung line
  const tSd = t0 + 1.83;                   // "so deeply" — wind tighter
  const y0 = 13, y1 = g.rows - 3;          // ~70% of screen height
  const cx = Math.round(g.cols / 2);
  const W = 12;                            // helix ≈ 15–20% of screen width
  const pitch0 = (Math.PI * 2) / 10, pitch1 = (Math.PI * 2) / 7.5;
  const pitch = pitch0 + (pitch1 - pitch0) * ease(clamp01((t - tSd) / 0.5));
  const th = (Math.PI * (t - t0)) / len;   // ~half a turn per line
  const A = 'me', B = 'you';
  for (let yy = y0; yy <= y1; yy++) {
    const phi = (yy - y0) * pitch + th;
    const s = Math.sin(phi);
    const front = Math.cos(phi) > 0;       // which strand is nearer the eye
    const xa = cx + Math.round(W * s);
    const xb = cx - Math.round(W * s);
    g.put(xa, yy, A[(yy - y0) % 2], front ? 3 : 2);
    g.put(xb, yy, B[(yy - y0) % 3], front ? 2 : 3);
    if ((yy - y0) % 3 === 0) {             // base-pair rungs where strands part
      const lo = Math.min(xa, xb) + 2, hi = Math.max(xa, xb) - 2;
      if (hi - lo >= 2) {
        const ch = ((yy - y0) / 3) % 2 === 0 ? '-' : '=';
        for (let x = lo; x <= hi; x++) g.put(x, yy, ch, 1);
      }
    }
  }

  // H-shaped end caps (director sketch): a 3-letter column on each end —
  // me side m·e·m (m/e cycle), you side y·o·u (spells "you") — with the
  // '=' bar set INSIDE them on the middle row (e + '='×25 + o, adjacent,
  // never invading the letter columns). Bars sit just outside the bead span
  // (y0-1 / y1+1); the letter columns (cx±(W+1)) are ones the winding
  // beads never reach; every horizontal connector, cap bars and rungs
  // alike, stays '-'/'='
  const cap = (yb: number): void => {
    g.put(cx - W - 1, yb - 1, 'm', 2);
    g.put(cx - W - 1, yb, 'e', 2);
    g.put(cx - W - 1, yb + 1, 'm', 2);
    g.put(cx + W + 1, yb - 1, 'y', 2);
    g.put(cx + W + 1, yb, 'o', 2);
    g.put(cx + W + 1, yb + 1, 'u', 2);
    for (let x = cx - W; x <= cx + W; x++) g.put(x, yb, '=', 2);
  };
  cap(y0 - 1);
  cap(y1 + 1);
}
