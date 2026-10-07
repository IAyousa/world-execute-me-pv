import { Grid } from '../engine/grid';
import { pseudoBg } from '../engine/deco';
import { KICKS, BEAT, pulseBefore } from '../engine/song';
import { hash } from '../engine/rng';
import { typeLine, recent, pulseRings, ease, clamp01, Scene } from './shared';
import { T, WINDOWS } from '../timeline';

const L = [
  'If I can, if I can, give you all the STIMULATIONS',
  'Then I can, then I can be your only SATISFACTION',
  'If I can make you happy, I will run the EXECUTION',
  'Though we are trapped in this strange strange SIMULATION',
];

/** kick-ring speed: a ring must sweep all the way to the screen edge and
 *  die there — from cx≈74 the last visible ellipse radius is ~82 cols,
 *  reached at age ≈2.1s of the 2.2s ring life. */
const RING_SPEED = 38;

/** the one point — me at its minimal form. L1: the pump core every kick
 *  throbs out of; L2: the only afterglow, breathing. Same cell, same ramp. */
function sparkPoint(g: Grid, cx: number, cy: number, e: number): void {
  if (e <= 0.1) return; // fully extinguished
  g.put(cx, cy, e > 0.7 ? '●' : e > 0.4 ? '•' : '·', e > 0.7 ? 4 : e > 0.4 ? 3 : 2);
  if (e > 0.55) { g.put(cx - 1, cy, '·', 2); g.put(cx + 1, cy, '·', 2); }
  if (e > 0.9) g.put(cx, cy - 1, '·', 3);
}

/** S03 · 58.6–73.9 · CHORUS 1 — first overflow; execute interrupted */
export const scene: Scene = {
  draw(g: Grid, t: number, f: number) {
    const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
    let tt = t; // display time — unit D freezes it for the stutter

    if (t < T.chorus1[1]) {
      // B — overflow: sparse letter field; one ring per kick expands all
      // the way to the screen edge; the pump-core point throbs at center
      pseudoBg(g, t, 31, 0.08);
      pulseRings(g, cx, cy, t, recent(KICKS, t, 2.2), RING_SPEED);
      sparkPoint(g, cx, cy, 0.45 + 0.55 * pulseBefore(KICKS, t, 7));
    } else if (t < T.chorus1[2]) {
      // C — the only satisfaction left: letters dissolve toward black,
      // L1's final rings sweep off the edge, and the point — the same
      // point — breathes alone until the line ends
      const t0 = T.chorus1[1], t1 = T.chorus1[2];
      const thin = 1 - clamp01((t - t0) / 0.8);
      if (thin > 0) pseudoBg(g, t, 31, 0.08 * thin);
      pulseRings(g, cx, cy, t, recent(KICKS, t0, 2.2), RING_SPEED);
      const breath = 0.5 + 0.5 * Math.sin(Math.PI * (t - t0)); // ~0.5 Hz, kick-free
      const fadeOut = 1 - ease((t - (t1 - 0.45)) / 0.45);
      sparkPoint(g, cx, cy, (0.15 + 0.65 * breath) * fadeOut);
    } else if (t < T.chorus1[3]) {
      // the prompt: world.execute(me); — typed, then interrupted
      const y = g.rows - 8;
      const line = '> world.execute(me);';
      const typed = line.slice(0, Math.max(0, Math.floor((t - (T.chorus1[2] + 0.4)) * 13)));
      if (t < T.chorus1[2] + 2.4) {
        g.puts(10, y, line.slice(0, Math.max(0, typed.length)), 3);
        if (typed.length < line.length && Math.floor(t * 7) % 2 === 0) g.put(10 + typed.length, y, '▌', 4);
      } else {
        // interrupted: line jolts, dims, ^C flashes, fresh prompt below
        const jx = t < T.chorus1[2] + 2.75 ? Math.round(Math.sin(t * 90) * 2) : 0;
        g.puts(10 + jx, y, line.slice(0, 12), 1);
        g.puts(10 + 13 + jx, y, '✗ aborted', 5);
        if (Math.floor((t - (T.chorus1[2] + 2.4)) * 2) % 2 === 0) g.puts(10, y + 2, '> _', 3);
        g.center(y - 4, '[ execution deferred — reason: not enough of me yet ]', 2);
      }
    } else {
      // D — the strange simulation: the world stutters. On each kick the
      // whole screen freezes 2–3 frames, then jumps ahead; the top rows
      // jerk out of line, bounded, re-rolled per beat
      const s0 = T.chorus1[3];
      const PEAK = s0 + 3.08; // second "strange strange" — strangeness peaks
      const CALM = s0 + 3.72; // world quiet again before VERSE 2
      const envOf = (u: number) => u < PEAK
        ? clamp01((u - s0) / (PEAK - s0))
        : 1 - clamp01((u - PEAK) / (CALM - PEAK));
      // this beat's kick, frame-aligned: a kick with kickFrame ≤ f satisfies
      // tk < (f+0.5)/30 exactly, so recent() at that lookahead never misses
      const rk = recent(KICKS, (f + 0.5) / 30, BEAT * 1.5)[0];
      const kf = rk === undefined ? -1 : Math.round(rk * 30);
      let joltX = 0;
      if (rk !== undefined) {
        const ke = envOf(rk);
        if (ke > 0.12 && f >= kf && f - kf < (ke > 0.55 ? 3 : 2)) {
          tt = rk;
          joltX = (hash(kf, 73) < 0.5 ? -1 : 1) * 6; // grid teleports once…
        }
      }
      const envD = envOf(tt); // …and frozen frames render identically
      const topJerk = kf < 0 || envD <= 0 ? 0 : Math.round(
        (hash(kf, 71) < 0.5 ? -1 : 1) * (2 + Math.floor(hash(kf, 70) * 5)) * Math.min(1, envD * 1.4));
      for (let y = 4; y < g.rows - 4; y += 2) {
        const warp = Math.round(Math.sin(y * 0.5 + tt * 1.4) * envD * 5);
        for (let x = 8; x < g.cols - 8; x += 5) {
          g.put(x + warp + (y < 8 ? topJerk : 0) + joltX, y, '·', y < 8 ? 2 : 1);
        }
      }
    }
    // lyrics last: the pseudo-code rain must never overwrite a typed line
    L.forEach((ln, i) => typeLine(g, 6, 3 + i * 2, ln, tt, T.chorus1[i], 24, WINDOWS.chorus1[i][1]));
  },
};
