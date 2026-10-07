import { Grid, PHOSPHOR } from '../engine/grid';
import { commentBlock, drawHeart, viewfinder, glitchPass, bigWord } from '../engine/deco';
import { SNARES, pulseBefore } from '../engine/song';
import { hash } from '../engine/rng';
import { typeLine, Scene } from './shared';
import { T, WINDOWS } from '../timeline';

const L1 = 'If I can, if I can, feel your VIBRATIONS';
const L2 = 'Then I can, then I can finally be COMPLETION';
const L4 = 'If I can, if I can, erase all the pointless FRAGMENTS';
const LD = "Then maybe, then maybe you won't leave me so DISHEARTENED";
const L5 = 'Challenging your god, you have made some ILLEGAL ARGUMENTS';
const EXC = 'Exception in thread "me": illegal arguments in challenge(God)';

// 词级词戳（timeline 只到句级）：三枚均以「T.chorus2 句起 + 相对偏移」表达，
// 含义 = 该词在唱句中被唱出的时刻，供进度条冻结 / 蓝屏 / 尾词翻红锚定。
const COMPLETION_AT = T.chorus2.completion + 3.0;       // "COMPLETION" 唱出 ≈110.22
const DISHEARTENED_AT = T.chorus2.disheartened + 3.17;  // "DISHEARTENED" 唱出 ≈124.89
const ILLEGAL_AT = T.chorus2.arguments + 5.52;          // "ILLEGAL ARGUMENTS" 唱出 ≈131.22

/** S06 · 103.48–132.5 · CHORUS 2 — you have left (ADR-0001: deletion take, B ghosts folded in) */
export const scene: Scene = {
  draw(g: Grid, t: number, f: number) {
    const snare = pulseBefore(SNARES, t, 8);

    if (t < T.chorus2.youFirst) {
      // L1/L2: the vibration dies — amplitude decays monotonically onto the
      // dim 0V baseline (no floor); every column keeps its char, the wave
      // only loses height, flatlines, and the baseline carries its corpse
      const cy = Math.round(g.rows / 2);
      typeLine(g, 8, cy - 4, L1, t, T.chorus2.vibrations, 24, T.chorus2.completion);
      typeLine(g, 8, cy - 2, L2, t, T.chorus2.completion, 24, T.chorus2.youFirst);
      const wDur = WINDOWS.chorus2[0][1] - T.chorus2.vibrations;   // L1 窗长
      const damp = Math.max(0, 1 - (t - T.chorus2.vibrations) / wDur);
      const tPh = Math.min(t, T.chorus2.vibrations + wDur);        // phase stops when flat
      const wY = cy + 6;
      for (let x = 0; x < g.cols; x++) g.put(x, wY, '─', 1);       // 0V baseline
      if (damp > 0) {
        for (let x = 0; x < g.cols; x++) {
          const v = Math.sin((x / g.cols) * Math.PI * 8 - tPh * 6) * damp;
          const y = wY + Math.round(v * 2.2);
          const ci = Math.abs(v) > 1.6 ? 3 : Math.abs(v) > 0.25 ? 2 : 1;
          g.put(x, y, v > 0 ? '≈' : '~', ci);
        }
      }
      // the completion bar: born 100% on the section's hard cut, holds
      // ~0.6s, then retreats one cell per SNARE tick (boot-bar grammar from
      // INTRO-L1); ONE bar across the L1/L2 windows, frozen ≈1/4 at the
      // sung word COMPLETION — the residual sits still until the YOU×5 cut
      const barW = 24;
      const holdEnd = T.chorus2.vibrations + 0.6;
      const cap = Math.min(t, COMPLETION_AT);          // freeze at the word stamp
      let ticks = 0;
      for (let i = 0; i < SNARES.length && SNARES[i] <= cap; i++) {
        if (SNARES[i] >= holdEnd) ticks++;
      }
      const fill = Math.max(0, barW - ticks);
      const pct = Math.round((fill / barW) * 100);
      const barY = cy - 7;
      const bx = Math.round((g.cols - (barW + 7)) / 2);
      g.put(bx, barY, '[', 2);
      for (let k = 0; k < barW; k++) {
        g.put(bx + 1 + k, barY, k < fill ? '▓' : '░', k < fill ? 3 : 1);
      }
      g.puts(bx + barW + 1, barY, `] ${String(pct).padStart(3)}%`,
        t < T.chorus2.vibrations + 0.45 ? 4 : 2);
    } else if (t < T.chorus2.youFirst + 5 * T.chorus2.youStep) {
      // YOU ×5 — deleted letter by letter, five times, each harsher
      const pass = Math.min(4, Math.floor((t - T.chorus2.youFirst) / T.chorus2.youStep));
      const inPass = (t - T.chorus2.youFirst) - pass * T.chorus2.youStep;
      // the opening phrase types once at the standard lyric spot, then
      // vanishes the instant the first echo lights up above the big YOU
      const echoAt = T.chorus2.youFirst + 2 * T.chorus2.youStep;
      if (t < echoAt) typeLine(g, 8, 3, 'Though you have left', t, T.chorus2.youFirst);
      // B-version ghosts: dim skewed rows over the big YOU (passes 3+)
      for (let k = 0; k < pass - 1; k++) {
        const age = (t - T.chorus2.youFirst) - (k + 1) * T.chorus2.youStep;
        const frag = Math.max(0, age - 1.8) * 0.3;
        const y = 9 + k * 2;
        let x = Math.round(g.cols / 2) - 6 + k;
        for (let c = 0; c < 12; c++) {
          const fr = hash(k * 61 + c, Math.floor(t * 3));
          // three stages: intact -> dot -> dissolved away entirely
          if (fr >= frag * 0.5) {
            g.put(x, y + Math.round((c - 6) * 0.2), fr < frag ? '·' : 'You have left'[c], k === 0 ? 2 : 1);
          }
          x++;
        }
      }
      glitchPass(g, snare * 0.5 + pass * 0.06, f);
    } else if (t < T.chorus2.fragments) {
      // isolation: the sandbox, the heart — node ②
      viewfinder(g, 6, 3, g.cols - 7, g.rows - 4, 3, 4);
      // the phrase appears alone first; the heart pops in together with
      // the word itself, on the beat it is sung
      const isoSplit = T.chorus2.isolationSplit;
      if (t > isoSplit) drawHeart(g, g.cols / 2, g.rows * 0.46, 1, t - isoSplit > 0.4 ? 4 : 2);
      const iso = t < isoSplit ? 'You have left me in' : 'ISOLATION';
      // center on the heart's ink (col 74); +6 = commentBlock's `/* ` + ` */`
      typeLine(g, Math.round(74 - (iso.length + 6) / 2), 32, iso, t, t < isoSplit ? T.chorus2.isolation : isoSplit, 26);
    } else if (t < T.chorus2.arguments) {
      // pointless fragments: the memory was organized once — six addressed
      // columns of 2x5 hex blocks. From ≈118.7 they crumble in hash order:
      // whole blocks fall with gravity, break into 2-3 chars at the floor
      // and go dark; ≈121.0 the screen is blank and L6 keeps it that way
      const collapseAt = T.chorus2.fragments + 0.4;    // ≈118.7: first block lets go
      const GRAV = 90;                                 // rows/s² — accelerating fall
      const FLOOR = g.rows - 6;
      const HEX = '0123456789ABCDEF';
      for (let c = 0; c < 6; c++) {
        const bx = 10 + c * 25;
        const nB = 3 + (hash(c, 55) > 0.5 ? 1 : 0);
        let lastDepart = -Infinity;
        for (let s = 0; s < nB; s++) {
          const id = c * 4 + s;
          const top = 12 + s * 6;
          const fallAt = collapseAt + hash(id, 909);   // hash order, no sweep
          lastDepart = Math.max(lastDepart, fallAt);
          const dLand = FLOOR - (top + 4);             // rows between block bottom and floor
          const landAt = fallAt + Math.sqrt((2 * dLand) / GRAV);
          const seed = c * 97 + s * 17;                // unique per block cell
          if (t < landAt) {
            const disp = t < fallAt ? 0 : Math.round(0.5 * GRAV * (t - fallAt) * (t - fallAt));
            for (let dy = 0; dy < 5; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                g.put(bx + dx, top + dy + disp,
                  HEX[Math.floor(hash(seed + dy * 3 + dx, 311) * 16)], 1);
              }
            }
          } else if (t < landAt + 0.25) {
            // touched down: scatters into 2-3 chars, then goes dark
            const nSc = 2 + Math.floor(hash(id, 515) * 2);
            for (let j = 0; j < nSc; j++) {
              g.put(bx - 1 + Math.floor(hash(id, j + 60) * 4),
                FLOOR - Math.floor(hash(j, id + 70) * 2),
                HEX[Math.floor(hash(id * 10 + j, 311) * 16)], 1);
            }
          }
        }
        if (t < lastDepart) {
          // the address header outlives its blocks, then winks out too
          const hd = `0x${HEX[Math.floor(hash(c, 7) * 16)]}${HEX[Math.floor(hash(c, 13) * 16)]}` +
            `${HEX[Math.floor(hash(c, 19) * 16)]}${HEX[Math.floor(hash(c, 23) * 16)]}`;
          g.puts(bx - 2, 10, hd, 2);
        }
      }
      typeLine(g, 8, 4, L4, t, T.chorus2.fragments, 30, T.chorus2.disheartened);
      typeLine(g, 8, 6, LD, t, T.chorus2.disheartened, 30, T.chorus2.arguments);
      glitchPass(g, 0.12, f);
    } else {
      // red exception — the first wide use of red in the film
      const k = t - T.chorus2.arguments;
      commentBlock(g, 8, g.rows - 7, EXC, Math.floor(k * 40), 5);
      typeLine(g, 8, 4, L5, t, T.chorus2.arguments + 0.05, 40, WINDOWS.chorus2[6][1]);
      // the sung tail flips red ON the word stamp — the upgrade lands on
      // the voice, not before it (red is a color, not a new move)
      if (t >= ILLEGAL_AT) {
        const tail = 'ILLEGAL ARGUMENTS';
        const tx = 8 + 3 + (L5.length - tail.length);  // +3 = commentBlock 的 "/* " 前缀
        for (let i = 0; i < tail.length; i++) g.put(tx + i, 4, tail[i], 5);
      }
      // the whole report is heartbreak-colored: stack lines land ci5
      const stacks = [
        '\tat world.challenge(God.java:1)',
        '\tat me.love(Love.java:∞)',
        '\tat universe.main(Universe.java:42)',
      ];
      stacks.forEach((s, i) => {
        if (k > 0.6 + i * 0.2) g.puts(10, g.rows - 5 + i, s, 5);
      });
      glitchPass(g, 0.18 + snare * 0.2, f);
    }
  },
  overlay(ctx, t, w, h) {
    if (t >= T.chorus2.youFirst && t < T.chorus2.youFirst + 5 * T.chorus2.youStep) {
      const pass = Math.min(4, Math.floor((t - T.chorus2.youFirst) / T.chorus2.youStep));
      const inPass = (t - T.chorus2.youFirst) - pass * T.chorus2.youStep;
      const vis = Math.max(0, 3 - Math.floor(inPass * 4.3));
      const word = 'YOU'.slice(0, vis);
      const size = h * 0.34 * (1 + (pass % 2) * 0.05 + pass * 0.02);
      if (word.length > 0 && inPass < 0.62) {
        bigWord(ctx, word, w / 2, h / 2, size,
          pass >= 3 ? PHOSPHOR.bright : PHOSPHOR.main, PHOSPHOR.dim, 1.8);
        // the deletion caret, blinking right where the next letter dies
        if (Math.floor(t * 8) % 2 === 0) {
          const cw = ctx.measureText('M').width;
          bigWord(ctx, '▌', w / 2 + (word.length + 0.25) * cw * 1.8 - cw * 0.4, h / 2, size * 0.8,
            PHOSPHOR.bright, undefined, 1);
        }
      } else if (inPass >= 0.62 && Math.floor(inPass * 10) % 2 === 0) {
        bigWord(ctx, '▯', w / 2, h / 2, size * 0.6, PHOSPHOR.main, undefined, 1);
      }
    }
    // C2-L6 蓝屏一闪（契约修订唯一例外色）：DISHEARTENED 词戳上全屏转 BSOD 蓝
    // #0078d7，不透明；歌词行按网格原位以 ci4 亮色重绘在蓝场上（CharStage
    // 度量：24px 单元、top 基线，逐字符对位），屏中央 :( 一枚；0.4s
    // （≈124.9–125.3）整层退场，暗绿留白态原样回归，蓝不越本窗。
    if (t >= DISHEARTENED_AT && t < DISHEARTENED_AT + 0.4) {
      ctx.fillStyle = '#0078d7';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '24px Consolas, "Courier New", monospace';
      ctx.textBaseline = 'top';
      const cellW = Math.max(8, Math.round(ctx.measureText('M').width));
      ctx.fillStyle = PHOSPHOR.bright;
      const line = `/* ${LD} */`;
      for (let i = 0; i < line.length; i++) ctx.fillText(line[i], (8 + i) * cellW, 6 * 24);
      bigWord(ctx, ':(', w / 2, h / 2, h * 0.2, '#eaffee', undefined, 1);
    }
  },
};
