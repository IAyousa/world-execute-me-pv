import { Grid } from '../engine/grid';
import { hash } from '../engine/rng';
import { typeLine, convergeBitmap, bitmap, ripple } from './shared';
import { T, WINDOWS } from '../timeline';

const L = [
  "If I'm an eggplant, then I will give you my NUTRIENTS",
  "If I'm a tomato, then I will give you ANTIOXIDANTS",
  "If I'm a tabby cat, then I will purr for your ENJOYMENT",
  "If I'm the only god, then you're the proof of my EXISTENCE",
];
// sparse zone: stations land on the violin's bar-long notes (= T.verse2 grid)
const ST = T.verse2;

const EGGPLANT = [
  '           :=+++=.-+- ',
  '         :##********+ ',
  '       .#@@@@*******. ',
  '      +@@@@@@*******= ',
  '    :%@@@@@@@###****: ',
  '   +@@@@@@@@@@@@@#*+  ',
  '  *@@@@@@@@@@@@@@+:   ',
  ' +@@@@@@@@@@@@@@+     ',
  '.@@@@@@@@@@@@@@%      ',
  '*@@@@@@@@@@@@@@#      ',
  '%@@@@@@@@@@@@@@@      ',
  '%@@@@@@@@@@@@@@@#     ',
  '+@@@@@@@@@@@@@@@@%:   ',
  '.@@@@@@@@@@@@@@@@@@#. ',
  ' +@@@@@@@@@@@@@@@@@@@:',
  '  *@@@@@@@@@@@@@@###%%',
  '   +@@@@@@@@@@@@%###%@',
  '    -@@@@@@@@@@@@@%@@%',
  '      *@@@@@@@@@@@@@@.',
  '       .#@@@@@@@@@@#  ',
  '          -*%@@%*=    ',
];

const TOMATO = [
  '            =           ',
  '  ++++++=: == :=++++++  ',
  '  :+++****=++=****+++:  ',
  '   -****************-   ',
  '  #%*******@@*******%#  ',
  ' @@@@@@@@@@@@@@@@@@@@@@ ',
  '*@@@@@@@@@@@@@@@@@@@@@@*',
  '@@@@@@@@@@@@@@@@@@@@@@@@',
  '@@@@@@@@@@@@@@@@@@@@@@@@',
  '+@@@@@@@@@@@@@@@@@@@@@@+',
  ' %@@@@@@@@@@@@@@@@@@@@% ',
  '  +@@@@@@@@@@@@@@@@@@+  ',
  '    =%@@@@@@@@@@@@%=    '
];

const CAT = [
  '      ∧_______∧     ',
  '     |         |    ',
  '  =  |  ∩   ∩  |  = ',
  ' == |     ω     | ==',
  '  = |           | = ',
  '    |           |   ',
  '     \\_________/    ',
];

/** statue silhouette rows — width grows downward like a seated colossus */
const STATUE_ROWS = [
  '                          ',
  '            :===          ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            %@@@+         ',
  '  #@@@@@@@@@@@@@@@@@@@@@@@',
  '  #@@@@@@@@@@@@@@@@@@@@@@@',
  '  .---------@@@@#---------',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            #@@@=         ',
  '            =###:         ',
  '                          ',
];

/** S04 · 73.9–81.5 · VERSE 2 — still-life quartet, brisk, over the sparse beat */
export const draw = (g: Grid, t: number): void => {
  const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
  L.forEach((ln, i) => typeLine(g, 6, 3 + i * 2, ln, t, ST[i], 34, WINDOWS.verse2[i][1]));

  // spotlight: faint stage floor line
  for (let x = cx - 44; x < cx + 44; x++) g.put(x, g.rows - 9, x % 3 === 0 ? '·' : ' ', 1);

  if (t < ST[1]) {
    // eggplant — one nutrient float, quick
    convergeBitmap(g, EGGPLANT, cx - 11, cy - 11, t, ST[0] + 0.1, 3);
    if (t > ST[0] + 1.05) {  // labels appear only after the converge settles
      const age = t - ST[0] - 1.05;
      // unit D (round5): ≥50px net clearance from the silhouette — the label
      // starts 5 cols past the widest art row's right edge (=4 empty cells
      // ×13px = 52px); same float-up row formula, content and ci tier as before
      const eggRight = cx - 11 + Math.max(...EGGPLANT.map(r => r.length)) - 1;
      g.puts(eggRight + 5, cy - 1 - Math.round(age * 3), 'K+ Mg', age < 0.7 ? 3 : 2);
    }
  } else if (t < ST[2]) {
    // tomato + antioxidant tick (no lingering eggplant: one still per station)
    convergeBitmap(g, TOMATO, cx - 12, cy - 7, t, ST[1] + 0.1, 3);
    if (t > ST[1] + 1.05) {  // labels appear only after the converge settles
      const n = Math.floor((t - ST[1] - 1.05) * 8);
      g.puts(cx + 17, cy - 2, `antioxidants: ${n}++`, 3);
    }
  } else if (t < ST[3]) {
    // tabby cat, same stage scale as the other stills, one purr ripple.
    // Effects track the art's live size, so re-scaling the cat never
    // detaches the purr ripple / note from it.
    const catW = CAT[0].length, catY = cy - Math.floor(CAT.length / 2);
    const purrAge = t - ST[2] - 1.05;
    // purr ring grows from the cat's middle exactly like the original
    // (same timing/radius curve) — only the center moved; drawn before
    // the cat so face glyphs always win the overlap (ADR-0007)
    if (purrAge > 0) ripple(g, cx, catY + Math.floor(CAT.length / 2), purrAge, '~');
    convergeBitmap(g, CAT, cx - Math.floor(catW / 2), catY, t, ST[2] + 0.1, 3);
    if (purrAge > 0) {  // effects appear only after the converge settles
      g.puts(cx + Math.floor(catW / 2) + 1, catY + 1, '~♪', 3);
    }
    // (round5 unit E) me block removed: the intro's dissolve arc closes here,
    // VERSE2 runs block-free; next me sighting is the C1 light-point
  } else {
    // the only god: crucified corpus, then betrays its texture for one beat
    const y0 = cy - Math.floor(STATUE.length / 2);
    const meTexture = t > ST[3] + 1.8;
    const sway = Math.sin(t * 0.9) * 0.8;
    STATUE.forEach((ln, r) => {
      for (let c = 0; c < ln.length; c++) {
        const ch = ln[c];
        if (ch === ' ') continue;
        const x = cx - Math.floor(ln.length / 2) + c + Math.round(sway * (c / ln.length - 0.5));
        if (meTexture) {
          g.put(x, y0 + r, (c + r) % 2 === 0 ? 'm' : 'e', (c + r) % 2 === 0 ? 3 : 2);
        } else {
          g.put(x, y0 + r, ch, ch === '@' || ch === '%' ? 3 : 2);
        }
      }
    });
    g.center(y0 + STATUE.length + 2, meTexture ? 'Σ me = god · you = proof' : '[ deus.ex.machina ]', 3);
    // fireflies of faith
    for (let i = 0; i < 12; i++) {
      const fx = cx - 30 + hash(i, 41) * 60;
      const fy = cy - 12 + hash(i, 42) * 20 + Math.sin(t + i) * 1.5;
      g.put(Math.round(fx), Math.round(fy), '.', hash(i, Math.floor(t * 3)) < 0.5 ? 1 : 2);
    }
  }
};

export const STATUE = STATUE_ROWS;
