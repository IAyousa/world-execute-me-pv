import { Grid, PHOSPHOR } from '../engine/grid';
import { pseudoBg, bigWord } from '../engine/deco';
import { hash } from '../engine/rng';
import { T } from '../timeline';
import { Scene } from './shared';

// ending-sequence anchor read from the timeline (round 10 unit E: contract §3
// absolute-second debt cleared; value identical, pure re-anchoring). The old
// bare `T0 = 191.77` (true instrumental outro start) had no references.
const T4 = T.ending.seqAt;

/** S10 · 191.77–end · OUTRO — the world retires; then exit, flash, CRT shutdown */
export const scene: Scene = {
  draw(g: Grid, t: number) {
    if (t < T4) {
      // staged retirement inside the real instrumental outro (191.77–200)
      const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
      const fade = (t0: number, span = 2.2) => Math.max(0, 1 - (t - t0) / span);

      const gridA = fade(193.5);
      if (gridA > 0) {
        for (let y = 5; y < g.rows - 5; y += 3) {
          for (let x = 8; x < g.cols - 8; x += 6) {
            if (hash(x, y) < gridA * 0.7) g.put(x, y, '·', 1);
          }
        }
      }
      const hexA = fade(195.5);
      if (hexA > 0) {
        for (let i = 0; i < 20 * hexA; i++) {
          const x = 4 + hash(i, 95) * (g.cols - 8);
          const y = ((hash(i, 96) * g.rows) + t * (2 + hash(i, 97) * 3)) % g.rows;
          g.put(Math.round(x), Math.round(y), '0123456789ABCDEF'[Math.floor(hash(i, Math.floor(t * 2)) * 16)], 1);
        }
      }
      const heartA = fade(197.5);
      if (heartA > 0) {
        for (let i = 0; i < 24; i++) {
          const a = hash(i, 98) * Math.PI * 2;
          const drift = (t - 197.5) * 3;
          const x = cx + Math.cos(a) * (10 + drift);
          const y = cy + Math.sin(a) * (6 + drift * 0.6);
          g.put(Math.round(x), Math.round(y), i % 3 === 0 ? '8' : '#', heartA > 0.5 ? 2 : 1);
        }
      }
      // occasional single me falls
      if (Math.floor(t * 0.7) % 3 === 0) {
        const i = Math.floor(t * 0.7);
        const x = 10 + hash(i, 99) * (g.cols - 20);
        const y = ((t * 4) % (g.rows + 2)) - 1;
        g.put(Math.round(x), Math.round(y), 'e', 1);
      }
      // nothing left to idle: the world runs down
      if (Math.floor(t * 1.2) % 2 === 0) g.center(cy - 1, '·', 1);
      if (t > 195) pseudoBg(g, t, 21, Math.max(0, 0.05 * fade(198.5, 3)));
    } else {
      const rel = t - T4;
      if (rel < 6.8) {
        pseudoBg(g, t, 21, 0.1);
        const line = '> world.exit(me);';
        const typed = line.slice(0, Math.max(0, Math.floor((rel - 3) * 14)));
        if (rel > 3) {
          g.puts(Math.round((g.cols - line.length) / 2), Math.round(g.rows * 0.75), typed, 3);
          if (typed.length < line.length && Math.floor(rel * 6) % 2 === 0) {
            g.put(Math.round((g.cols - line.length) / 2) + typed.length, Math.round(g.rows * 0.75), '▌', 4);
          }
        }
      }
    }
  },
  overlay(ctx, t, w, h) {
    if (t < T4) return;
    const rel = t - T4;
    if (rel >= 5.8 && rel < 6.8) {
      bigWord(ctx, 'Execution', w / 2, h / 2, h * 0.22, PHOSPHOR.bright, PHOSPHOR.dim, 1.5);
    }
    if (Math.abs(rel - 6.8) < 1 / 60) {
      ctx.fillStyle = '#eaffee';
      ctx.fillRect(0, 0, w, h);
    }
    // OUTRO-r1: tail screen one phosphor tier dimmer (mid→dim, main→mid; the
    // dim thank-you stays dim — lowest non-zero tier), and the whole tail
    // screen now HOLDS to the last frame (定格) instead of blanking at 211.5.
    // Typing cadence, blink rhythm and all earlier moments unchanged.
    if (rel >= 8.6) {
      const s = '[ process exited with code 0 ]';
      const typed = s.slice(0, Math.max(0, Math.floor((rel - 8.6) * 20)));
      bigWord(ctx, typed, w / 2, h / 2, 34, PHOSPHOR.dim, undefined, 1.2);
    }
    if (rel >= 9.9) {
      bigWord(ctx, '// thank you, Mili', w / 2, h / 2 + 60, 22, PHOSPHOR.dim, undefined, 1.2);
    }
    // U-OUTRO-CARET-r10 (unit F): the caret rides the typed text via
    // measureText (S06 backspace-caret pattern) instead of a hardcoded
    // w/2+20 that parked it mid-line behind "exited" — during typing it
    // follows the head, once the line is done it sits right after "]"
    // blinking 2.2Hz to the final held frame.
    if (rel >= 8.6) {
      const s = '[ process exited with code 0 ]';
      const typed = s.slice(0, Math.max(0, Math.min(s.length, Math.floor((rel - 8.6) * 20))));
      ctx.font = 'bold 34px Consolas, monospace';
      const cellW = ctx.measureText('M').width * 1.2;  // bigWord(…, 34, …, 1.2) advance
      const done = typed.length >= s.length;
      if (!done || Math.floor(rel * 2.2) % 2 === 0) {
        ctx.fillStyle = PHOSPHOR.mid;
        ctx.fillText('▌', w / 2 + typed.length * cellW / 2, h / 2);
      }
    }
  },
  collapse(t: number) {
    const rel = t - T4;
    if (rel < 6.8) return { sy: 1, lineGlow: 0, lineW: 1 };
    if (rel < 8.0) {
      const k = (rel - 6.8) / 1.2;
      return { sy: Math.max(0.004, 1 - Math.pow(k, 2.6)), lineGlow: k > 0.55 ? 1 : k, lineW: 1 };
    }
    if (rel < 8.6) {
      const k = (rel - 8.0) / 0.6;
      return { sy: 0, lineGlow: 1, lineW: Math.max(0.014, 1 - k) };
    }
    const k = Math.min(1, (rel - 8.6) / 0.5);
    return { sy: 0, lineGlow: 1 - k, lineW: 0.014 };
  },
};
