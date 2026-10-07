import songJson from '../../public/song.json';

export interface Note { t: number; d: number; p: number; v: number; ch: number }

// song.json stores each note as a bare [t, d, p, v, ch] row. Wrap once at
// load so consumers see the documented Note objects. (round 4, unit A: the
// old `as unknown as {notes: Note[]}` cast was a lie — property reads hit
// undefined, KICKS/SNARES/HATS/LEADS filtered to empty and waveAt returned
// NaN, starving every pulse/wave effect. Fail loud if the shape drifts.)
const RAW = songJson as unknown as {
  bpm: number; len: number; prog: Record<string, number>;
  notes: [number, number, number, number, number][];
};
if (!Array.isArray(RAW.notes) || RAW.notes.length === 0 ||
    typeof RAW.notes[0]?.[0] !== 'number' || RAW.notes[0].length < 5) {
  throw new Error('song.ts: song.json notes shape mismatch — expected [t,d,p,v,ch] rows');
}
export const SONG = {
  ...RAW,
  notes: RAW.notes.map(([t, d, p, v, ch]) => ({ t, d, p, v, ch })),
};
export const FPS = 30;
export const BEAT = 60 / SONG.bpm;
export const BARD = BEAT * 4;

const N = SONG.notes;
export const KICKS = N.filter(n => n.ch === 9 && n.p < 38).map(n => n.t);
export const SNARES = N.filter(n => n.ch === 9 && n.p >= 38 && n.p < 48).map(n => n.t);
if (KICKS.length === 0 || SNARES.length === 0) {
  throw new Error('song.ts: drum tracks empty after load — data/filter mismatch');
}
export const HATS = N.filter(n => n.ch === 9 && n.p >= 48).map(n => n.t);
export const LEADS = N.filter(n =>
  n.ch !== 9 && n.v > 70 &&
  (SONG.prog[String(n.ch)] === 11 || SONG.prog[String(n.ch)] === 40));

/** exponential pulse of the most recent event at/before t (0..1) */
export function pulseBefore(times: number[], t: number, decay = 6): number {
  let lo = 0, hi = times.length - 1, best = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (times[m] <= t) { best = m; lo = m + 1; } else hi = m - 1;
  }
  if (best < 0) return 0;
  return Math.exp(-(t - times[best]) * decay);
}

/** notes whose span intersects [t, t+window] */
export function notesNear(notes: Note[], t: number, window: number): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    if (n.t > t + window) break;
    if (n.t + n.d >= t) out.push(n);
  }
  return out;
}

/** synthetic waveform sample at time t: sum of active-note envelopes, 0..~1 */
export function waveAt(t: number): number {
  let s = 0;
  for (const n of SONG.notes) {
    if (n.t > t + 0.05) break;
    const dt = t - n.t;
    if (dt < 0 || dt > n.d) continue;
    const e = Math.min(1, dt / 0.01) * Math.exp(-Math.max(0, dt - n.d + 0.05) * 12);
    s += e * (n.v / 127) * (n.ch === 9 ? 0.5 : 0.22);
  }
  return Math.min(1, s);
}
