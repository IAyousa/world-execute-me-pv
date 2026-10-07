import { Grid } from '../engine/grid';
import { drawDonut } from '../engine/deco';
import { hash } from '../engine/rng';

const T0 = 14.8;  // guitar riff enters 14.77 — no vocals until 29.5
const STATUSES: [number, string][] = [
  [14.9, '[ world.ready — simulation started ]'],
  [18.6, 'objects: 1 · users: 2 (me, you)'],
  [22.3, 'heartbeat .............. ok'],
  [26.0, 'love.init() ......... pending'],
];

/** S00b · 14.8–29.5 · INTERLUDE ① — the riff, the newborn world idling */
export const draw = (g: Grid, t: number): void => {
  const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);

  // the world's first idle: the donut, alone, content
  drawDonut(g, cx, cy - 1, g.cols * 0.11, t * 0.5, t * 0.2);

  // breathing grid: the fresh world settling
  for (let y = 4; y < g.rows - 6; y += 3) {
    for (let x = 6; x < g.cols - 6; x += 6) {
      if (hash(x, y) < 0.35 + 0.15 * Math.sin(t * 0.8 + x * 0.2 + y)) g.put(x, y, '·', 1);
    }
  }

  // bar-aligned status lines
  for (const [t0, s] of STATUSES) {
    if (t >= t0 && t < t0 + 3.5) {
      const fresh = t < t0 + 0.4;
      g.center(2, s, fresh ? 3 : 2);
    }
  }

  // a slow scan column sweeps the world once per 4 bars
  const scan = Math.floor(((t - T0) / 7.4) % 1 * g.cols);
  if (t - T0 > 1) {
    for (let y = 3; y < g.rows - 5; y++) g.put(scan, y, '│', 1);
  }
};
