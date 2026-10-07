import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Grid, PHOSPHOR, Palette } from './engine/grid';

export interface CollapseState { sy: number; lineGlow: number; lineW: number }

export const CharStage: React.FC<{
  draw: (g: Grid, relT: number, frame: number) => void;
  overlay?: (ctx: CanvasRenderingContext2D, relT: number, w: number, h: number, frame: number) => void;
  collapse?: (relT: number) => CollapseState;
  pal?: Palette;
}> = ({ draw, overlay, collapse, pal = PHOSPHOR }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const t = frame / fps;
    const cellH = 24;
    const font = `${cellH}px Consolas, "Courier New", monospace`;
    ctx.font = font;
    const cellW = Math.max(8, Math.round(ctx.measureText('M').width));
    const cols = Math.floor(width / cellW), rows = Math.floor(height / cellH);
    const g = new Grid(cols, rows);
    draw(g, t, frame);

    const off = document.createElement('canvas');
    off.width = width; off.height = height;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.fillStyle = pal.bg;
    octx.fillRect(0, 0, width, height);
    octx.font = font;
    octx.textBaseline = 'top';
    g.blit(octx, cellW, cellH, pal);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const c = collapse ? collapse(t) : { sy: 1, lineGlow: 0, lineW: 1 };
    const sy = Math.max(c.sy, 0.002);
    const drawH = height * sy;
    if (c.sy > 0.01) ctx.drawImage(off, 0, (height - drawH) / 2, width, drawH);
    if (c.lineGlow > 0) {
      ctx.fillStyle = pal.bright;
      ctx.globalAlpha = Math.min(1, c.lineGlow);
      const lw = width * Math.max(0.012, Math.min(1, c.lineW));
      ctx.fillRect((width - lw) / 2, height / 2 - 1.5, lw, 3);
      ctx.globalAlpha = 1;
    }
    if (overlay) {
      ctx.textBaseline = 'middle';
      overlay(ctx, t, width, height, frame);
    }
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      <canvas ref={ref} width={width} height={height} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,.35) 100%,' +
          'repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 1px, rgba(0,0,0,0) 1px 3px)',
      }} />
    </div>
  );
};
