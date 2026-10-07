import { Grid } from '../engine/grid';
import { bigWord, glitchPass, viewfinder } from '../engine/deco';
import { KICKS, SNARES, pulseBefore } from '../engine/song';
import { hash } from '../engine/rng';
import { typeLine, meBlock, ease, Scene } from './shared';
import { T, WINDOWS } from '../timeline';

const L34 = 'If I can, if I can give them all the EXECUTION';
const L35 = 'Then I can, then I can be your only EXECUTION';
const L36 = 'If I can have you back, I will run the EXECUTION';
const L37 = 'Though we are trapped, we are trapped ah';

// r9b — the word card is RETIRED (director 2026-10-07: "replace it with the
// guillotine"). The rig takes the card's slot and its life, all anchored to
// T.chorus3 stamps: slams in while the line is singing (unrelated to the L3
// ghost flicker — no dodge, no handoff), blade ratchets up through the line,
// rope always tying blade to beam (ratchet up = rope shortens, drop = rope
// pays out), drops on the sung stamp, chop frame flashes ci4, hard out.
const GATE_IN = 0.29;     // l35-relative hard-in — the retired card's slot
const GATE_FALL = 0.19;   // blade drop duration, gravity (k·k)
const GATE_TAIL = 0.21;   // l35Exec-relative hard-out (one chop frame included)

function guillotine(g: Grid, t: number): void {
  const tIn = T.chorus3.l35 + GATE_IN;
  const tOut = T.chorus3.l35Exec + GATE_TAIL;
  if (t < tIn || t >= tOut) return;
  const cxc = Math.round(g.cols / 2);
  const top = Math.round(g.rows / 2) - 10;        // rig rows 13..32 — cage-tall sibling
  const bot = top + 19;
  const cocked = top + 3, rest = bot - 2;         // blade rows: 16..17 up, 30..31 down
  const liftEnd = T.chorus3.l35Exec - 0.21;       // ratchet completes 0.2s before the drop
  let bt: number;
  if (t < liftEnd) bt = rest + (cocked - rest) * Math.min(1, (t - tIn) / (liftEnd - tIn));
  else if (t < T.chorus3.l35Exec) bt = cocked;
  else {
    const k = Math.min(1, (t - T.chorus3.l35Exec) / GATE_FALL);
    bt = cocked + (rest - cocked) * k * k;        // gravity: accelerating drop
  }
  bt = Math.round(bt);
  const chopped = t >= T.chorus3.l35Exec + GATE_FALL;
  for (const px of [cxc - 13, cxc + 13]) for (let r = top; r <= bot; r++) g.put(px, r, '║', 3);
  for (let x = cxc - 13; x <= cxc + 13; x++) { g.put(x, top, '▔', 3); g.put(x, bot, '▔', 3); }
  for (let r = top + 1; r < bt; r++) g.put(cxc, r, '|', 3);   // the rope: beam to blade, always
  for (let r = 0; r < 2; r++) for (let x = cxc - 10; x <= cxc + 10; x++) g.put(x, bt + r, '▓', chopped ? 4 : 3);
}

/** round 9 unit C — the cage as a rigid OBJECT (~31×20 cells) dropped over
 *  me, not a fullscreen texture. Bars sit symmetric at pitch 4 and none on
 *  me's 3 columns; the kick shiver is capped at ±1 cell so a jittered bar
 *  can never reach them either. Descent is front-loaded: 87% of the drop
 *  lands in the first third of k, so the cage enters the branch already
 *  past the lyric band (rows 3–7 never hold a bar while L37 types), then
 *  creeps the last rows and settles; at k>=1 the base welds shut cage-wide
 *  and [ trapped ] rides directly under it. */
function meCage(g: Grid, k: number, t: number, kick: number): void {
  const cxc = Math.round(g.cols / 2);               // me's axis
  const H = 20;                                     // cage height, rows
  const topFinal = Math.round(g.rows / 2) - 10;     // 13: me rows 23–25 + label sit inside
  const travel = topFinal + H;                      // starts fully above the frame
  const FAST = 0.868;                               // e at k=1/3 → cage top ≈ row 9, lyric band cleared
  const e = k < 1 / 3 ? FAST * ease(k * 3) : FAST + (1 - FAST) * ((k - 1 / 3) / (2 / 3));
  const y0 = Math.round(topFinal - (1 - e) * travel);
  for (const off of [-15, -11, -7, -3, 3, 7, 11, 15]) {
    const x = cxc + off + Math.round(Math.sin(t * 2 + off) * kick);
    for (let r = 0; r < H - 1; r++) g.put(x, y0 + r, r % 4 === 0 ? '╤' : '║', 3);
  }
  if (k >= 1) {
    const seal = y0 + H - 1;                        // the base welds shut — cage-wide, not screen-wide
    for (let x = cxc - 15; x <= cxc + 15; x += 3) g.put(x, seal, '▔', 2);
    g.puts(cxc - 6, seal + 2, '[ trapped ]', 2);    // rides with the cage, under its base
  }
  // r9b: the cage closes at the top too — a cage-width rail rides the descent
  // (rigid object, sealed both ends; door lintel vocabulary in r10's spec)
  for (let x = cxc - 15; x <= cxc + 15; x += 3) g.put(x, y0, '▔', 2);
}

/** S08 · 162.63–177.24 · CHORUS 3 — word card, the complete execute, the cage */
export const scene: Scene = {
  draw(g: Grid, t: number, f: number) {
    const cx = Math.round(g.cols / 2);
    const snare = pulseBefore(SNARES, t, 8);

    if (t < T.chorus3.l35) {
      // opening: the ash-fall of the broken world, tiered up (round 9 A):
      // 40→90 particles, main tier ci1→ci2 — the embers become visible while
      // staying an environment layer (never ci4, same slow-settle ×3 and
      // hash vocabulary as the climax field)
      for (let i = 0; i < 90; i++) {
        const x = hash(i, 71) * g.cols;
        const y = ((hash(i, 73) * g.rows) + (t - T.chorus3.l34) * 3) % (g.rows + 4);
        g.put(Math.round(x), Math.round(y), hash(i, 74) < 0.3 ? '*' : '·', hash(i, 75) < 0.3 ? 3 : 2);
      }
      typeLine(g, 8, 3, L34, t, T.chorus3.l34 + 0.6, 30, T.chorus3.l35);
      // r9b: the incidental glitch red is retired — L1's only red from now on
      // is the blood-red stamp itself (round 7 glitchPassRed wrapper pattern)
      const colBefore = g.col.slice();
      glitchPass(g, 0.08, f);
      for (let i = 0; i < g.col.length; i++) if (g.col[i] === 5 && colBefore[i] !== 5) g.col[i] = 3;
    } else if (t < T.chorus3.l36 - 1.2) {
      // the guillotine window (rig + falling embers)
      typeLine(g, 8, 3, L34, t, T.chorus3.l34 + 0.6, 30, T.chorus3.l35);
      typeLine(g, 8, 5, L35, t, T.chorus3.l35, 26, T.chorus3.l36);
      // round 9 A: 30→70 particles, same accelerated ×5 fall, all ci2
      for (let i = 0; i < 70; i++) {
        const x = hash(i, 71) * g.cols;
        const y = ((hash(i, 73) * g.rows) + (t - T.chorus3.l35) * 5) % (g.rows + 4);
        g.put(Math.round(x), Math.round(y), hash(i, 74) < 0.3 ? '*' : '·', 2);
      }
      guillotine(g, t);
    } else if (t < T.chorus3.l36 + 2.2) {
      // the stroke tail (drop + chop) lives here at the branch head, UNDER the
      // ghost flicker — the rig is an L2 element that happens to outlive the
      // branch boundary; the flicker draws over it (director: unrelated)
      guillotine(g, t);
      // the empty YOU flickers — then the line is typed IN FULL, enter falls
      typeLine(g, 8, 3, L36, t, T.chorus3.l36, 28, T.chorus3.l37);
      if (t >= T.chorus3.l36 - 1.2 && t < T.chorus3.l36) {
        const flick = [T.chorus3.l36 - 1.2, T.chorus3.l36 - 0.7, T.chorus3.l36 - 0.3].some(t0 => t >= t0 && t < t0 + 0.22);
        if (flick) {
          viewfinder(g, cx - 14, Math.round(g.rows / 2) - 4, cx + 14, Math.round(g.rows / 2) + 4, 2, 3);
          g.center(Math.round(g.rows / 2), 'Y O U', 1);
        }
      }
      const y = g.rows - 10;
      const line = '> world.execute(me);';
      // r9c: clamp the slice — a negative index before the typing start showed
      // a backwards-growing phantom prefix through the ghost flickers (latent
      // baseline bug, JS slice(0,-n) truncates instead of emptying)
      const typed = line.slice(0, Math.max(0, Math.floor((t - (T.chorus3.l36 + 0.4)) * 12)));
      g.puts(10, y, typed, 3);
      if (typed.length < line.length && Math.floor(t * 7) % 2 === 0) g.put(10 + typed.length, y, '▌', 4);
    } else if (t < T.chorus3.l37) {
      // running
      typeLine(g, 8, 3, L36, t, T.chorus3.l36, 28, T.chorus3.l37);
      const y = g.rows - 10;
      g.puts(10, y, '> world.execute(me);', 3);
      const k = Math.min(1, (t - (T.chorus3.l36 + 2.2)) / 0.9);
      g.puts(10, y + 2, `[running] ${Math.round(k * 100)}% `, 4);
      for (let b = 0; b < Math.round(k * 22); b++) g.put(10 + 10 + b, y + 2, '█', 3);
    } else {
      // the cage drops over me (LRC: trapped at 173.64)
      typeLine(g, 8, 3, L37, t, T.chorus3.l37, 28, WINDOWS.chorus3[3][1]);
      const k = Math.min(1, (t - (T.chorus3.l37 - 0.6)) / 1.8);
      const kick = pulseBefore(KICKS, t, 6);
      meCage(g, k, t, kick);
      meBlock(g, cx - 1, Math.round(g.rows / 2), 4);
    }
  },
  overlay(ctx, t, w, h) {
    // r9b: the verdict's echo — a blood-red EXECUTION stamps once on the sung
    // word (contract exception #c00000, this 0.24s window only)
    if (t >= T.chorus3.l34Exec && t < T.chorus3.l34Exec + 0.24) {
      bigWord(ctx, 'EXECUTION', w / 2, h / 2, h * 0.2, '#c00000', undefined, 1.4);
    }
    // the enter key: a single-frame confirmation flash
    if (Math.abs(t - (T.chorus3.l36 + 2.2)) < 1 / 60) {
      ctx.fillStyle = 'rgba(224,255,230,0.5)';
      ctx.fillRect(0, 0, w, h);
    }
  },
};
