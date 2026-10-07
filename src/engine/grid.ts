export interface Palette {
  bg: string; dim: string; mid: string; main: string; bright: string; accent: string;
}

export const PHOSPHOR: Palette = {
  bg: '#040604', dim: '#357a48', mid: '#4da361', main: '#7dff9a',
  bright: '#e0ffe6', accent: '#ff5f56',
};

export const RAMP = '.,-~:;=!*#$@';

/** character grid frame buffer */
export class Grid {
  cols: number; rows: number;
  ch: string[]; col: number[];

  constructor(cols: number, rows: number) {
    this.cols = cols; this.rows = rows;
    this.ch = new Array(cols * rows).fill(' ');
    this.col = new Array(cols * rows).fill(0);
  }
  clear() { this.ch.fill(' '); this.col.fill(0); }
  put(x: number, y: number, c: string, ci = 2) {
    // round: float coords must not leak into i = y*cols+x — with odd cols a
    // *.5 + *.5 sums to an integer and silently writes the WRONG cell (ADR-0014)
    const xi = Math.round(x), yi = Math.round(y);
    if (xi >= 0 && xi < this.cols && yi >= 0 && yi < this.rows) {
      const i = yi * this.cols + xi;
      this.ch[i] = c; this.col[i] = ci;
    }
  }
  puts(x: number, y: number, s: string, ci = 2) {
    for (let i = 0; i < s.length; i++) this.put(x + i, y, s[i], ci);
  }
  center(y: number, s: string, ci = 2) {
    this.puts(Math.round((this.cols - s.length) / 2), y, s, ci);
  }
  blit(ctx: CanvasRenderingContext2D, cellW: number, cellH: number, pal: Palette) {
    const buckets: string[][] = [[], [], [], [], [], []];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        if (this.ch[i] !== ' ') buckets[this.col[i]].push(String(x), String(y), this.ch[i]);
      }
    }
    const colors = [pal.bg, pal.dim, pal.mid, pal.main, pal.bright, pal.accent];
    for (let b = 1; b < 6; b++) {
      ctx.fillStyle = colors[b];
      const arr = buckets[b];
      for (let k = 0; k < arr.length; k += 3) {
        ctx.fillText(arr[k + 2], Number(arr[k]) * cellW, Number(arr[k + 1]) * cellH);
      }
    }
  }
}
