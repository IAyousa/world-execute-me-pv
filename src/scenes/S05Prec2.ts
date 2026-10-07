import { Grid } from '../engine/grid';
import { pseudoBg } from '../engine/deco';
import { KICKS, pulseBefore, BEAT } from '../engine/song';
import { hash } from '../engine/rng';
import { typeLine, ease } from './shared';
import { T, WINDOWS } from '../timeline';
import { STATUE } from './S04Verse2';

const L = [
  'Switch my gender to F to M',
  'And then do whatever from AM to PM',
  'Oh switch my role to S to M',
  'So we can enter the trance the trance',
];

/** PC2-L4 slow push, rigid-element edition (grid 平移近似): translate a
 * finished scattered-texture LAYER cell-by-cell along the push field —
 * pseudoBg only. Text elements never come through here: they translate at
 * their draw origin as rigid bodies, so their internal spacing can never
 * change (no doubled, dropped or holed characters). Scene-private wrapper. */
function pushBlit(g: Grid, src: Grid, dxOf: (x: number) => number, dyOf: (y: number) => number): void {
  for (let y = 0; y < src.rows; y++) {
    const oy = dyOf(y);
    for (let x = 0; x < src.cols; x++) {
      const i = y * src.cols + x;
      if (src.ch[i] === ' ') continue;
      g.put(x + dxOf(x), y + oy, src.ch[i], src.col[i]);
    }
  }
}

/** S05 · 88.58–103.48 · PRE-CHORUS 2 — config diff; the screen heats up, fast */
export const draw = (g: Grid, t: number): void => {
  const cx = Math.round(g.cols / 2);
  const kick = pulseBefore(KICKS, t, 6);
  const breathe = 1 + kick * 0.06;

  // PC2-L4 trance push: from the trance window on, every element translates
  // RIGIDLY away from the screen center by round(ref−center)·(push−1) — the
  // grid-translation approximation of a one-way eased zoom (1.00→1.04 across
  // the window ≈4s, monotonic, no kick jitter, locked at the far edge; the
  // section cut into C2 drops it whole, so the cold open never inherits it).
  // Elements: panel = ONE unit (frame+header+rows+clock together — per-row
  // translation could poke interior text past the frame edge); selector and
  // each lyric line = one unit each; scattered textures (pseudoBg, glow,
  // dots) translate per cell. Before the window push=1: every offset is 0
  // and the frame is cell-for-cell as it was. The letterspaced trance card
  // is the one exception — pinned coords, never pushed (its tracking is its
  // own motion; no double scaling).
  const tTr = T.prec2[3], tC2 = WINDOWS.prec2[3][1];
  const push = t > tTr ? 1 + 0.04 * ease(Math.min(1, (t - tTr) / (tC2 - tTr))) : 1;
  const acx = (g.cols - 1) / 2, acy = (g.rows - 1) / 2;
  const dxOf = (x: number): number => Math.round((x - acx) * (push - 1));
  const dyOf = (y: number): number => Math.round((y - acy) * (push - 1));

  // the crucifix dissolves into the diff era (cross-section dissolve)
  if (t < T.prec2[0] + 1.1) {
    const a = Math.max(0, 1 - (t - T.prec2[0]) / 1.1);
    const y0 = Math.round(g.rows / 2) - Math.floor(STATUE.length / 2);
    STATUE.forEach((ln, r) => {
      for (let c = 0; c < ln.length; c++) {
        if (ln[c] === ' ' || hash(c + r, 77) > a) continue;
        const x = cx - Math.floor(ln.length / 2) + c;
        const yy = y0 + r;
        g.put(x + dxOf(x), yy + dyOf(yy), '·', 1);
      }
    });
  }

  // breathing pseudo-code backdrop, denser as heat rises (per-cell push layer)
  const heat = Math.min(1, Math.max(0, (t - T.prec2[0]) / 14.9));
  const bgBuf = push > 1 ? new Grid(g.cols, g.rows) : null;
  pseudoBg(bgBuf ?? g, t, 51, 0.08 + heat * 0.1 * breathe);
  if (bgBuf) pushBlit(g, bgBuf, dxOf, dyOf);

  // diff panel (breathes ±1 with the beat) — one rigid element under the push
  const px = cx - 22, py = 12 + Math.round(kick);
  const pw = 44;
  const qx = px + dxOf(px), qy = py + dyOf(py);
  g.puts(qx, qy, `┌${'─'.repeat(pw - 2)}┐`, 3);
  g.puts(qx, qy + 1, `│ --- me.config`, 2);
  g.puts(qx + 17, qy + 1, `${' '.repeat(pw - 19 - 11)}+++ patched │`, 2);
  const rows: [string, number, number][] = [
    ['- me.gender = F', T.prec2[0] + 0.3, 2],
    ['+ me.gender = M', T.prec2[0] + 0.5, 4],
    ['- me.role   = dom', T.prec2[2] - 0.1, 2],
    ['+ me.role   = sub', T.prec2[2] + 0.1, 4],
  ];
  rows.forEach(([s, t0, ci], i) => {
    if (t > t0) g.puts(qx + 2, qy + 3 + i, s, ci);
  });
  if (t > T.prec2[1] && t < T.prec2[2]) {
    // the clock spins AM → PM in the panel's middle row
    const k = (t - T.prec2[1]) / 1.4;
    const total = Math.floor(k * k * 24 * 60 * 3);
    const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    g.puts(qx + 2, qy + 5, `  clock ${hh}:${mm}  AM▸PM`, 3);
  }
  g.puts(qx, qy + 8, `└${'─'.repeat(pw - 2)}┘`, 3);

  // me's slot is a TWO-ROW persistent state selector (r5b, director-approved
  // mockup): ♀♂ on row 15, ▲▼ on row 17, both present L1→L4 (no swap, no
  // exit); the me [F]/[M] label is retired ("only the two indicators").
  // Same grammar per row as PC1-L1's AC/DC menu: both options juxtaposed,
  // the live one ci4, the other ci2; at each row's lyric stamp the choice
  // flips through one beat where BOTH flash ci4. Semantic mapping: ♀/▲ ↔
  // the `-` row side (F / dom), ♂/▼ ↔ the `+` row side (M / sub). Under
  // the trance push both rows translate rigidly with the screen.
  const mx = cx + 30;                        // slot column: ♀/▲ @mx, ♂/▼ @mx+2
  const rGen = 15, rArrow = 17;              // the two persistent rows
  const tGen = T.prec2[0] + 1.61;            // 手册 LRC 戳 "to F to M" ≈90.19
  const tSub = T.prec2[2] + 2.27;            // 手册 LRC 戳 "S to M" ≈97.73
  const sel = (row: number, tFlip: number, chL: string, chR: string): void => {
    const flash = t >= tFlip && t < tFlip + BEAT;  // 翻转帧：两枚短促同亮一拍
    const flipped = t > tFlip;
    g.put(mx + dxOf(mx), row + dyOf(row), chL, flash || !flipped ? 4 : 2);
    g.put(mx + 2 + dxOf(mx + 2), row + dyOf(row), chR, flash || flipped ? 4 : 2);
  };
  sel(rGen, tGen, '♀', '♂');
  sel(rArrow, tSub, '▲', '▼');

  // rising heat: edge rows glow and pulse (per-cell push)
  if (heat > 0.2) {
    const glow = heat * (0.5 + kick * 0.5);
    const gy0 = 1 + dyOf(1), gy1 = g.rows - 3 + dyOf(g.rows - 3);
    for (let x = 4; x < g.cols - 4; x += 2) {
      if (hash(x, Math.floor(t * 2)) < glow) {
        g.put(x + dxOf(x), gy0, '▒', 4);
        g.put(x + dxOf(x), gy1, '▒', 4);
      }
    }
  }

  if (t > tTr) {
    // trance: focus wavers, everything breathes harder (through the push)
    const k = ease((t - tTr) / 0.9);
    for (let i = 0; i < 30; i++) {
      const x = 6 + hash(i, 61) * (g.cols - 12);
      const y = 4 + hash(i, 62) * (g.rows - 8);
      const dy = Math.round(Math.sin(t * 1.5 + i) * k * 2);
      const xi = Math.round(x), yi = Math.round(y + dy);
      g.put(xi + dxOf(xi), yi + dyOf(yi), '·', 1);
    }
  }
  // lyrics last: the pseudo-code rain must never overwrite a typed line
  // (each line one rigid element under the push)
  L.forEach((ln, i) => {
    const ly = 3 + i * 2;
    typeLine(g, 6 + dxOf(6), ly + dyOf(ly), ln, t, T.prec2[i], 30, WINDOWS.prec2[i][1]);
  });

  // the pinned card, last and unmagnified (no double motion with its tracking)
  if (t > tTr) {
    const k = ease((t - tTr) / 0.9);
    g.center(g.rows - 5, 't r a n c e', k > 0.5 ? 4 : 2);
  }
};

/** r5b: L4 歌词结束白屏一闪 —— 复用片尾 Execution 闪白手法（S10Outro 同款
 * #eaffee 全屏 fillRect），占本段最后 2 帧（103.4133–103.48）；C2 冷开场
 * 首帧起本 overlay 越窗空操作，冷开场画面不受扰。 */
export const overlay = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number): void => {
  const tEnd = WINDOWS.prec2[3][1];
  if (t >= tEnd - 2 / 30 && t < tEnd) {
    ctx.fillStyle = '#eaffee';
    ctx.fillRect(0, 0, w, h);
  }
};
