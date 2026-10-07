import React from 'react';
import { Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CharStage } from './CharStage';
import { Grid, PHOSPHOR, Palette } from './engine/grid';
import { KICKS, pulseBefore } from './engine/song';
import { Scene, warmPal, ease } from './scenes/shared';
import { SECTIONS, T } from './timeline';
import * as S00 from './scenes/S00Intro';
import * as S00b from './scenes/S00bInterlude';
import * as S01 from './scenes/S01Verse1';
import * as S02 from './scenes/S02Prec1';
import * as S03 from './scenes/S03Chorus1';
import * as S04 from './scenes/S04Verse2';
import * as S05 from './scenes/S05Prec2';
import * as S06 from './scenes/S06Chorus2';
import * as S07c from './scenes/S07cClimax';
import * as S07 from './scenes/S07Bridge';
import * as S08 from './scenes/S08Chorus3';
import * as S09 from './scenes/S09Chorus4';
import * as S10 from './scenes/S10Outro';

const at = (id: string): number => SECTIONS.find(s => s.id === id)!.start;

/** section boundaries — single source of truth: src/timeline.ts (fan-LRC aligned) */
const SCENES: [number, Scene][] = [
  [at('intro'), { draw: S00.draw, overlay: S00.overlay }],
  [at('interlude1'), { draw: S00b.draw }],
  [at('verse1'), { draw: S01.draw }],
  [at('prec1'), { draw: S02.draw }],
  [at('chorus1'), S03.scene],
  [at('verse2'), { draw: S04.draw }],
  [at('prec2'), { draw: S05.draw, overlay: S05.overlay }],  // r5b: L4 末白屏一闪
  [at('chorus2'), S06.scene],
  [at('climax'), { draw: S07c.draw }],
  [at('wall'), { draw: S07.draw }],
  [at('chorus3'), S08.scene],
  [at('chorus4'), { draw: S09.draw }],
  [at('outro'), S10.scene],
];

const PAL_COLORS: string[] = [
  PHOSPHOR.bg, PHOSPHOR.dim, PHOSPHOR.mid, PHOSPHOR.main, PHOSPHOR.bright, PHOSPHOR.accent,
];

/** 官能线升温曲线：P1 起微暖，P2 峰值（随心跳脉动），C2 缓冷；终段叠唱留余温 */
function warmth(t: number): number {
  if (t < 44.45) return 0;
  if (t < 59.22) return 0.18 * ease((t - 44.45) / 8);
  if (t < 74.04) return 0.10;
  if (t < 88.58) return 0.06;
  if (t < 103.48) {
    // PREC2-L3 (round 1): push the S–M line to true amber. The ramp up to
    // the line stays frame-identical; from the line the palette climbs to
    // K_PEAK, holds through the sung line, then cools across the trance
    // into the C2 drop — the cold-landing contrast is kept, now wider.
    const P2 = at('prec2'), C2 = at('chorus2');
    const SM = T.prec2[2], TR = T.prec2[3];
    const DUR = C2 - P2;
    const K_SM = 0.5 * ((SM - P2) / DUR);          // ramp value where the S–M line starts
    const K_PEAK = 0.92;                            // ×0.82 pulse floor ⇒ every tier lands <70° hue
    const K_TRANCE_END = 0.366;                     // ×0.82 ⇒ ≈0.30, meets the C2 branch unbroken
    let k: number;
    if (t < SM) k = 0.5 * ((t - P2) / DUR);
    else if (t < SM + 2.3) k = K_SM + (K_PEAK - K_SM) * ease((t - SM) / 2.3);  // 2.3 ≈ "To S to M" sub-clause
    else if (t < TR) k = K_PEAK;
    else k = K_PEAK - (K_PEAK - K_TRANCE_END) * ease((t - TR) / (C2 - TR));
    return k * (0.82 + 0.22 * pulseBefore(KICKS, t, 6));
  }
  if (t < 132.5) return 0.30 * (1 - 0.55 * ((t - 103.48) / 29));
  if (t < 191.77) return t >= 177.24 ? 0.08 : 0;
  return 0;
}

export function sceneAt(t: number): Scene {
  let s = SCENES[0][1];
  for (const [start, sc] of SCENES) if (t >= start) s = sc;
  return s;
}

export const FullPV: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sc = sceneAt(t);

  return (
    <>
      <Audio src={staticFile('chiptune.mp3')} />
      <CharStage
        pal={warmPal(warmth(t))}
        draw={(g: Grid, u: number, f: number) => sc.draw(g, u, f)}
        overlay={(ctx, u, w, h, f) => {
          if (t >= 147.66 && t < 162.63) {
            S07.bridgeOverlay(ctx, u, w, h, ci => PAL_COLORS[ci] ?? PHOSPHOR.main);
          }
          if (sc.overlay) sc.overlay(ctx, u, w, h, f);
        }}
        collapse={sc.collapse}
      />
    </>
  );
};
