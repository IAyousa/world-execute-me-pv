import { Grid, PHOSPHOR } from '../engine/grid';
import { hash } from '../engine/rng';
import { typeLine, meBlock, ease } from './shared';
import { T, WINDOWS } from '../timeline';
import { PWR_ICON, SHIELD_ICON, QUEEN_OVERLAY } from './intro_icons';

const L1 = 'Switch on the power line, remember to put on PROTECTION';
const L2 = "Lay down your pieces and let's begin OBJECT CREATION";
const L3 = 'Fill in my data parameters, INITIALIZATION';
const L4 = "Set up our new world and let's begin the SIMULATION";

const FORM = [
  'me.name     = "me"',
  'me.gender   = F',
  'me.role     = dom',
  'me.love     = null',
];
const FORMWIDTH = Math.max(...FORM.map(l => l.length));

/** centered silhouette art, uniform color tier (shape carries the density) */
function drawArt(g: Grid, art: string[], cx: number, y0: number, ci: number, rowLimit = art.length): void {
  const w = Math.max(...art.map(r => r.length));  // first row may be blank — never anchor on it
  const x0 = Math.round(cx - w / 2);
  for (let r = 0; r < Math.min(rowLimit, art.length); r++) {
    for (let c = 0; c < art[r].length; c++) {
      if (art[r][c] !== ' ') g.put(x0 + c, y0 + r, art[r][c], ci);
    }
  }
}

/** S00 · 0–14.8 · INTRO — the lyrics are the boot log */
export const draw = (g: Grid, t: number): void => {
  // kernel line, always on
  if (t > 0.15) {
    const boot = '[ 0.000] world kernel v1.33.7 ............ boot';
    g.puts(3, 2, boot.slice(0, Math.max(0, Math.floor((t - 0.15) * 46))), 2);
  }

  if (t < T.intro[1]) {
    // centered boot UI (fan-PV idiom): power symbol → press → loading → shield
    const cx = Math.round(g.cols / 2);
    typeLine(g, 8, 4, L1, t, T.intro[0], 24, WINDOWS.intro[0][1]);

    const pressed = t > 0.5;
    const shieldAt = 2.92; // "put on PROTECTION" lands on the sung word
    const doneAt = 3.6;

    // central icon: PWR breathes → flare on press → swaps to the shield
    if (t < shieldAt) {
      const ci = !pressed
        ? (Math.floor(t * 1.6) % 2 === 0 ? 2 : 1)
        : t < 0.75 ? 4 : 3;
      drawArt(g, PWR_ICON, cx, 8, ci);
    } else {
      const rows = Math.floor((t - shieldAt) / 0.05) + 1;
      const complete = rows >= SHIELD_ICON.length;
      drawArt(g, SHIELD_ICON, cx, 8, complete ? 3 : 4, rows);
    }

    // loading bar directly under the icon + status line typing under it
    if (pressed) {
      const prog = Math.min(1, (t - 0.5) / (doneAt - 0.5));
      const barW = 30;
      const fill = Math.round(prog * barW);
      const y = 27;
      g.put(cx - 19, y, '|/-\\'[Math.floor(t * 10) % 4], 4);
      g.put(cx - 16, y, '[', 2);
      for (let k = 0; k < barW; k++) {
        g.put(cx - 15 + k, y, k < fill ? '▓' : '░', k < fill ? 3 : 1);
      }
      const pct = String(Math.round(prog * 100)).padStart(3);
      g.puts(cx + 15, y, `] ${pct}%`, 2);

      const status = t < shieldAt
        ? 'booting world kernel ...'
        : t < doneAt ? 'enabling protection ...' : '[ PROTECTION: ON ]';
      const sc = t < doneAt ? 2 : 4;
      const typed = status.slice(0, Math.max(0, Math.floor((t - 0.5) * 26)));
      g.puts(Math.round(cx - status.length / 2), 29, typed, sc);
    }
  } else if (t < T.intro[2]) {
    // OBJECT CREATION: the queen is laid down ON THE OVERLAY LAYER (high-
    // res canvas art — the grid's 45-row cap is why she used to blur);
    // here we only keep the lyric, the ctor line, and the me block
    const cx = Math.round(g.cols / 2);
    if (t > 5.2) {
      const line = '> const me = new Me();';
      const typed = line.slice(0, Math.max(0, Math.floor((t - 5.2) * 18)));
      // rows 24/27 (was 33/36): pulled up toward the queen above —
      // director round 5 vertical convergence
      g.puts(Math.round(cx - line.length / 2), 24, typed, 3);
      if (t > 6.3) meBlock(g, cx - 1, 27, 4);
    }
    typeLine(g, 8, 4, L2, t, T.intro[1], 24, WINDOWS.intro[1][1]);
  } else if (t < T.intro[3]) {
    // INITIALIZATION: centered me.config card, auto-fill + row cursor;
    // love stays null in the dimmest tier — love is not preinstalled
    const cx = Math.round(g.cols / 2);
    const fx = Math.round(cx - FORMWIDTH / 2);
    g.puts(Math.round(cx - 8), 15, '── me.config ──', 2);
    FORM.forEach((ln, i) => {
      const t0 = 7.6 + i * 0.55;
      if (t > t0) {
        const typed = ln.slice(0, Math.max(0, Math.floor((t - t0) * 30)));
        const dimNull = i === 3;
        g.puts(fx, 18 + i * 2, typed, dimNull ? 2 : 3);
        if (dimNull && typed.endsWith('null')) {
          // re-draw just the null in the dimmest tier
          g.puts(fx + typed.length - 4, 18 + i * 2, 'null', 1);
        }
        if (typed.length < ln.length && Math.floor(t * 8) % 2 === 0) {
          g.put(fx + typed.length, 18 + i * 2, '▌', 4);
        }
      }
    });
    if (t > 9.9) g.puts(Math.round(cx - 14), 27, 'initialization ......... [ OK ]', 4);
    typeLine(g, 8, 4, L3, t, T.intro[2], 24, WINDOWS.intro[2][1]);
  } else {
    // unit A (round 11): the world plane is BORN as the same hash-lit lattice
    // that will re-form it in the climax (S07c reforming branch) — same seed,
    // same pitch 4x2, same lighting order: birth and rebirth are one
    // animation. No snare flash layer here (climax drum semantics — the
    // genesis is quiet), so every lit site rests at ci2, and no axes, no
    // border, no origin mark: the world plane is an unbounded dot field.
    // k: half-lit at 12.0, complete at 12.7 — world ready just after
    const k = ease((t - 11.3) / 1.4);
    const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
    for (let y = 5; y < g.rows - 5; y += 2) {
      for (let x = 8; x < g.cols - 8; x += 4) {
        if (hash(x, y) < k) g.put(x, y, '·', 2);
      }
    }
    if (t > 12.9) g.center(g.rows - 3, '[ world.ready ]', 2);
    // boot-idiom hand-off: waiting for a keypress when the interlude kicks in
    if (t > 13.55) {
      // 25 chars at 26cps from 13.55 -> done 14.51, cursor blinks to cut
      const line = '[ press any key to start ]';
      const typed = line.slice(0, Math.floor((t - 13.55) * 26));
      g.puts(Math.round(cx - line.length / 2), cy + 3, typed, 3);
      if (typed.length >= line.length && Math.floor(t * 3) % 2 === 0) {
        g.put(Math.round(cx + line.length / 2) + 1, cy + 3, '▌', 4);
      }
    }
    // round 3 · INTRO-L4: me block retired from this window (born L2,
    // returns planned C1) — the vacated right edge stays empty, no filler
    typeLine(g, 8, 4, L4, t, T.intro[3], 24, WINDOWS.intro[3][1]);
  }
};


/** L2 overlay: the queen as a TEXT STREAM — whole-line fillText so the
 *  monospace glyphs abut at their natural advance (0.55em), exactly like
 *  an ASCII-art generator's text output. Per-cell 8px placement shears
 *  the art into dot-matrix mush (the "mosquito coil" bug). */
export function overlay(
  ctx: CanvasRenderingContext2D, t: number, w: number, h: number,
): void {
  if (t < T.intro[1] || t >= T.intro[2]) return;
  const k = ease((t - 3.9) / 1.2);
  const seated = k >= 1;
  const art = QUEEN_OVERLAY;
  const FS = 9;                        // director round 5: one notch smaller
  // still; art cells/shape unchanged
  const LH = FS;                       // line height = one cell
  const adv = FS * 0.55;               // Consolas advance (cell width)
  const maxCols = Math.max(...art.map(r => r.length));
  const aw = maxCols * adv, ah = art.length * LH;
  const x0 = Math.round(w / 2 - aw / 2);
  const yT = 160;                      // settles lower — pulled toward the
  // me ctor line below (director round 5: vertical convergence)
  const y0 = Math.round(-ah + k * (yT + ah));
  ctx.font = `${FS}px Consolas, "Courier New", monospace`;
  ctx.textBaseline = 'top';
  const flash = seated && t < 5.3;
  const CLASSES = [':;.-', '*+=', '@%#'];
  const TIERS = [PHOSPHOR.dim, PHOSPHOR.mid, PHOSPHOR.main];
  for (let r = 0; r < art.length; r++) {
    const line = art[r].padEnd(0);
    for (let ci = 0; ci < 3; ci++) {
      const masked = [...line].map(ch =>
        ch !== ' ' && CLASSES[ci].includes(ch) ? ch : ' ').join('');
      if (masked.trim().length === 0) continue;
      ctx.fillStyle = flash ? PHOSPHOR.bright : TIERS[ci];
      ctx.fillText(masked, x0, y0 + r * LH);
    }
  }
}
