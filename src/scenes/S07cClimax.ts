import { Grid } from '../engine/grid';
import { HEART, glitchPass } from '../engine/deco';
import { SNARES, pulseBefore } from '../engine/song';
import { hash } from '../engine/rng';
import { T } from '../timeline';

/** S07c · 132.5–147.66 · INSTRUMENTAL CLIMAX — no vocals; the storm and its embers */
export const draw = (g: Grid, t: number, f: number): void => {
  const snare = pulseBefore(SNARES, t, 8);
  const cx = Math.round(g.cols / 2);

  if (t < T.climax.drop + 3.4) {
    // the hit: the heart itself breaks apart — every bitmap cell becomes a
    // shard with its own release time, radial velocity, gravity, and a
    // density that cools ('@' -> '%' -> ... -> '.') as it flies
    const d = t - T.climax.drop;
    const RAMP = ' .:-=+*#%@';
    const w = HEART[0].length, h = HEART.length;
    const x0 = Math.round(cx - w / 2), y0 = Math.round(g.rows * 0.46 - h / 2);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const chr = HEART[r][c];
        if (chr === ' ') continue;
        const dd = d - hash(r * 31 + c, 91) * 0.35;      // staggered release
        if (dd <= 0) { g.put(x0 + c, y0 + r, chr, 4); continue; }
        const ux = (c - w / 2) / (w / 2);
        const uy = (r - h / 2) / (h / 2);
        const jit = (hash(r * 7 + c, 93) - 0.5) * 1.2;   // direction jitter
        const sp = 2.5 + hash(r * 17 + c, 92) * 8;       // cells per second
        const x = x0 + c + (ux + jit) * sp * dd + Math.sin(dd * 4 + c * 0.7) * 1.5;
        const y = y0 + r + uy * sp * 0.6 * dd + 2.4 * dd * dd;  // + gravity
        const dens = RAMP.indexOf(chr);
        const cool = dens - Math.floor(dd * 3.4);         // shard cools off
        if (cool <= 0) continue;
        const out = RAMP[Math.max(1, cool)];
        g.put(Math.round(x), Math.round(y), out, cool > 6 ? 4 : cool > 3 ? 3 : cool > 1 ? 2 : 1);
      }
    }
    // impact dust: a short generic burst for weight (first 1.2s only)
    if (d < 1.2) {
      for (let i = 0; i < 70; i++) {
        const a = hash(i, 1) * Math.PI * 2;
        const sp = (0.5 + hash(i, 2) * 1.5) * (6 + d * 22);
        g.put(Math.round(cx + Math.cos(a) * sp), Math.round(g.rows * 0.46 + Math.sin(a) * sp * 0.6),
          '.,-~:' [Math.floor(hash(i, 4) * 5)], hash(i, 6) < 0.6 ? 3 : 4);
      }
    }
    // unit C (round 7): the red accent inside glitchPass is C2-L7's afterglow —
    // licensed for the burst head only (first ~2s past the drop), then the
    // collapse tail and the ember field return to pure phosphor green
    glitchPassRed(g, 0.35 + snare * 0.4, f, d < 2.0);
  } else if (t < T.climax.end - 4) {
    // embers drift; the world slowly re-forms its grid
    for (let i = 0; i < 60; i++) {
      const x = hash(i, 71) * g.cols;
      const speed = 2 + hash(i, 72) * 4;
      const y = ((hash(i, 73) * g.rows) + (t - T.climax.drop) * speed) % (g.rows + 4);
      g.put(Math.round(x), Math.round(y), hash(i, 74) < 0.3 ? '*' : '·', hash(i, 75) < 0.3 ? 3 : 1);
    }
    // unit A (round 7): the reforming lattice, two tiers up — pitch 4x2 (was
    // 6x3, ~2.2x the sites), resting brightness ci2 (was ci1). k now clocks
    // from branch entry but still tops out at drop+8.6 (~141.5) exactly like
    // the old drop+2.6/+6 form, so the k~0.13 pop-in is gone and the
    // completion beat is unchanged (5.2 = 8.6 - 3.4)
    const k = Math.min(1, (t - T.climax.drop - 3.4) / 5.2);
    // snare heartbeat: the lit field flashes one tier (ci3) on each tick and
    // is back at ci2 within ~0.2s — squaring the pulse sharpens that tail, so
    // between beats the resting tier never reaches ci3
    const flash = snare * snare;
    for (let y = 5; y < g.rows - 5; y += 2) {
      for (let x = 8; x < g.cols - 8; x += 4) {
        if (hash(x, y) < k) g.put(x, y, '·', flash > hash(x * 7 + 3, y * 13 + 5) ? 3 : 2);
      }
    }
    glitchPassRed(g, 0.1, f, false);
  } else {
    // the last breath before the wall: grid dims, tension line at bottom
    // unit B (round 7): the dim-down inherits unit A's 4x2 pitch and ci2
    // resting tier — the hash gate runs 1 -> 0 (was 0.7*(1-k)) so the branch
    // boundary carries no density cliff, and each dot steps ci2 -> ci1 on its
    // own hash as k grows. No pulse here: the silence is the point
    const k = (t - (T.climax.end - 4)) / 4;
    for (let y = 5; y < g.rows - 5; y += 2) {
      for (let x = 8; x < g.cols - 8; x += 4) {
        if (hash(x, y) < 1 - k) g.put(x, y, '·', hash(x + 61, y + 13) < 1 - k ? 2 : 1);
      }
    }
    // execution notice dead-center — the line the broken heart used to sit on
    // (row 22; heart mid was rows*0.46 ~ 20.7). 2.4Hz blink unchanged
    if (Math.floor(t * 2.4) % 2 === 0) g.center(Math.round((g.rows - 1) / 2), '[ awaiting execution ]', 2);
    waveStripless(g, t);
  }
};

/** unit C (round 7): run glitchPass with its ci5 accent gated off. deco.ts is
 *  read-only, so the gate works on the public col buffer — snapshot before
 *  the pass, then demote every cell the pass painted or band-shifted to ci5
 *  back to the pass's own green tier (ci3). Cell count and positions are
 *  untouched, only the red is reclaimed. Exactly one scene draws per frame,
 *  so this sweep cannot touch another scene's accents. */
function glitchPassRed(g: Grid, amt: number, f: number, red: boolean): void {
  if (red) { glitchPass(g, amt, f); return; }
  const before = g.col.slice();
  glitchPass(g, amt, f);
  for (let i = 0; i < g.col.length; i++) {
    if (g.col[i] === 5 && before[i] !== 5) g.col[i] = 3;
  }
}

function waveStripless(g: Grid, t: number): void {
  // single quiet pulse line, ticking toward the wall
  if (Math.floor(t * 2) % 2 === 0) g.put(Math.round(g.cols / 2), g.rows - 2, '▂', 2);
}
