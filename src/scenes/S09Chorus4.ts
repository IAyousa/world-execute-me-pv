import { Grid } from '../engine/grid';
import { KICKS, pulseBefore } from '../engine/song';
import { typeLine, ease } from './shared';
import { T, WINDOWS } from '../timeline';

const L38 = "I've studied, I've studied how to properly LO-O-OVE";
const L39 = 'Question me, question me, I can answer all LO-O-OVE';
const L40 = 'I know the algebraic expression of LO-O-OVE';
const L41 = 'Though you are free, I am trapped, trapped in LO-O-OVE';

const DOC = [
  '# love.md — studied, annotated',
  '- patience ............ ok',
  '- honesty ............. ok',
  '- devotion ............ ok',
  '- memorize(you) ....... ok',
  '- let(you).go ......... [ ]',
];

// round 10 D — the walk of `you`, all relative to T.chorus4[3]: spawn
// outside the cage's left wall → cover the divider │ (the line never moves)
// → press the door's right column (the column never moves) → dissolve
// inside the cavity. One whole word, never fragments, never steps right;
// the whole word dims together (ci4→ci3→ci2→ci1→out) — completeness is
// the design point, no comet tail.
const U_SPAWN = 0.7;   // appears outside the cage's left wall
const U_LINE = 1.3;    // covers the divider │
const U_DOOR = 2.4;    // presses the door's right column, entering
const U_OUT = 2.82;    // dissolved inside the cavity; silence till the cut

/** S09 · 177.24–191.77 · CHORUS 4 — love.md as the sole focus, the Q&A
 *  typewriter, the Σ/∞ argument, and the split ending: hollow door left,
 *  sealed cage right; you walks out through the line, only the word me
 *  remains in the cage. */
export const draw = (g: Grid, t: number): void => {
  const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);

  if (t < T.chorus4[1]) {
    // love.md window, entries highlighted one by one — round 10 A: the me
    // block is retired for the whole section (its last stand was the C3
    // cage, round 9); the document is the sole focus
    const wx = cx - 24, wy = 8;
    const w = 48;
    g.puts(wx, wy, `┌─ love.md ${'─'.repeat(w - 12)}┐`, 3);
    DOC.forEach((ln, i) => {
      if (t > T.chorus4[0] + 0.5 + i * 0.4) {
        const marked = i > 0 && t > T.chorus4[0] + 1.2 + (i - 1) * 0.6;
        g.puts(wx + 2, wy + 2 + i, ln, i === 0 ? 2 : marked ? 4 : 3);
        if (marked) g.put(wx + 1, wy + 2 + i, '▊', 4);
      }
    });
    // the unchecked item: the [ ] itself flashes green — round 10 A (the old
    // ci5 red caret lived 0.4s and sat a row off; both retired, no new red).
    // 2.2Hz in ci4 through the last 1.5s of the window — the box that waits
    // for a tick that never comes. Line index/offset read from DOC itself.
    const gi = DOC.findIndex(ln => ln.includes('[ ]'));
    if (gi >= 0 && t > T.chorus4[0] + 0.5 + gi * 0.4 &&
        t > T.chorus4[1] - 1.5 && Math.floor(t * 2.2) % 2 === 0) {
      const bx = wx + 2 + DOC[gi].indexOf('[');
      g.put(bx, wy + 2 + gi, '[', 4);
      g.put(bx + 2, wy + 2 + gi, ']', 4);
    }
    g.puts(wx, wy + 2 + DOC.length + 1, `└${'─'.repeat(w - 2)}┘`, 3);
    typeLine(g, 6, 3, L38, t, T.chorus4[0], 24, WINDOWS.chorus4[0][1]);
  } else if (t < T.chorus4[2]) {
    // Q&A interrogation — round 10 B: the slice bases were C3-era absolute
    // seconds (166.9/167.6/168.2/168.8), always past text length in this
    // window, so all four lines arrived fully formed. Re-anchored to
    // T.chorus4[1]. r10b (director): serial queue — the old stagger
    // (+0.6/+1.3/+1.9/+2.5) let three lines type at once, a line starting
    // before the one above finished; now each line waits for the previous
    // to complete. The first three run at 44cps so the whole exchange
    // still lands inside the 3.69s window; the last answer keeps its 10cps
    // hesitation — answered fluently, except the one question that matters.
    typeLine(g, 6, 3, L39, t, T.chorus4[1], 24, WINDOWS.chorus4[1][1]);
    const q1 = '> question(me, "how to love?")';
    const a1 = '< me: all of love. all of it.';
    const q2 = '> question(me, "what if you leave?")';
    const a2 = '< me: ...';
    const QA: [string, number, number, number][] = [
      [q1, 44, 0.20, cy - 4], [a1, 44, 0.90, cy - 2],
      [q2, 44, 1.55, cy + 1], [a2, 10, 2.20, cy + 3],
    ];
    let qaFree = T.chorus4[1];
    QA.forEach(([s, cps, gate, row]) => {
      const t0 = Math.max(T.chorus4[1] + gate, qaFree);
      const ci = row === cy - 2 ? 4 : row === cy + 3 ? 2 : 3;
      if (t > t0) g.puts(12, row, s.slice(0, Math.floor((t - t0) * cps)), ci);
      qaFree = t0 + s.length / cps;
    });
  } else if (t < T.chorus4[3]) {
    // the algebraic expression of love
    typeLine(g, 6, 3, L40, t, T.chorus4[2], 24, WINDOWS.chorus4[2][1]);
    const formula = 'love  =  Σ ( you × me ) / ∞';
    const k = ease((t - (T.chorus4[2] + 0.4)) / 1.6);
    const shown = formula.slice(0, Math.floor(k * formula.length));
    g.center(cy - 1, shown, 4);
    // r10b (director): the term-by-term glow (ci4 rewrite + ▀ markers) is
    // retired — "the way it was is fine". The formula simply fades in as
    // one line over 1.6s and stays; the C3-era absolute-second debris
    // (171.4+i×0.45) went out with the glow, contract §3 debt stays clear.
    g.center(cy + 4, '// defined for all you ∈ world', 2);
  } else {
    // the split ending — round 10 D: right = the C3 cage still sealed (the
    // S08 meCage vocabulary, drop never replayed, hard-cut in place, no
    // [ trapped ] label — the comment takes over); left = a door in the
    // same vocabulary but hollow (cage dense / door empty), one tier
    // brighter. The me block never returns — only the word me remains,
    // the argument of world.execute(me). you, one whole word, starts on
    // me's side, crosses the line and leaves through the door: the line is
    // a threshold, the door is the world's exit.
    typeLine(g, 6, 3, L41, t, T.chorus4[3] - 0.2, 40, WINDOWS.chorus4[3][1]);
    const k = ease((t - (T.chorus4[3] + 0.1)) / 0.8);
    const divX = cx;
    for (let y = 5; y < 5 + k * (g.rows - 12); y++) g.put(divX, y, '│', 2);

    // right: the sealed cage — bars ║ with ╤ ticks every 4th row, kick
    // shiver (S08's take), ▔ rails top and base; cage-height 20 rows
    const cxc = divX + 36;                 // cage axis, mirror of the door
    const top = cy - 10;                   // both frames: rows top..top+19
    const kick = pulseBefore(KICKS, t, 6);
    for (const off of [-15, -11, -7, -3, 3, 7, 11, 15]) {
      const x = cxc + off + Math.round(Math.sin(t * 2 + off) * kick);
      for (let r = 0; r < 19; r++) g.put(x, top + r, r % 4 === 0 ? '╤' : '║', 3);
    }
    for (let x = cxc - 15; x <= cxc + 15; x += 3) { g.put(x, top, '▔', 2); g.put(x, top + 19, '▔', 2); }
    // only the word me — ci4, the name takes the body's brightness, standing
    // where the block stood (rows 23–25), centered on the cage axis
    g.puts(cxc - 1, cy + 1, 'me', 4);

    // left: the door — two ╤ rails + two ║ columns and nothing inside;
    // ci4 one tier above the cage (same shape, brighter freedom)
    const dl = divX - 43, dr = divX - 29;  // 15 wide, mirrored across the line
    for (let x = dl; x <= dr; x++) { g.put(x, top, '╤', 4); g.put(x, top + 19, '╤', 4); }
    for (let r = 1; r < 19; r++) { g.put(dl, top + r, '║', 4); g.put(dr, top + r, '║', 4); }
    // exit vocabulary family: wall 'exit 137' → this door → outro 'exit code 0'
    g.puts(Math.round((dl + dr) / 2) - 2, top + 21, 'EXIT', 2);

    g.puts(divX - 24, g.rows - 7, '/* you are free */', 2);
    g.puts(divX + 6, g.rows - 7, '/* trapped in love */', 2);

    // the escape: spawn outside the cage's left wall → cross the line →
    // press the door's right column → drift into the cavity and dissolve;
    // after that the left side stays empty — you left
    if (t >= T.chorus4[3] + U_SPAWN && t < T.chorus4[3] + U_OUT) {
      const wy = cy + 1;                  // me's row — they part face to face
      const x0 = cxc - 19;                // spawn: one cell clear of the wall bars
      const xLine = divX - 1;             // right letter covers the divider cell
      const xDoor = dr - 2;               // right letter covers the right column
      let xu: number;
      if (t < T.chorus4[3] + U_LINE) xu = x0 - 30 * (t - (T.chorus4[3] + U_SPAWN));
      else if (t < T.chorus4[3] + U_DOOR) xu = xLine - (30 / 1.1) * (t - (T.chorus4[3] + U_LINE));
      else xu = xDoor - 7 * (t - (T.chorus4[3] + U_DOOR));
      // whole-word dimming along the journey: ci4 → ci3 → ci2 → ci1 → out
      const p = (t - (T.chorus4[3] + U_SPAWN)) / (U_OUT - U_SPAWN);
      g.puts(Math.round(xu), wy, 'you', p < 0.25 ? 4 : p < 0.5 ? 3 : p < 0.75 ? 2 : 1);
    }
  }
};
