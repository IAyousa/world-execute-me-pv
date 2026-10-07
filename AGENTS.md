# AGENTS.md — guide for coding agents working in this repository

This repo renders a fan music video as React components (Remotion). The
picture is a 1920×1080 monospace **character grid**; the timeline is
derived from a user-supplied MIDI. Read this file before touching `src/`.

## Setup

```bash
npm install
python tools/prepare_assets.py [path/to/midi]   # generates public/song.json + public/chiptune.mp3
npm run studio                                   # preview
```

`public/song.json` and `public/chiptune.mp3` are **generated artifacts**:
never hand-edit them, never commit them (`.gitignore` blocks all media).
Never commit audio/MIDI/video files of any kind — this repository ships no
copyrighted material by design.

## Repo map

- `src/timeline.ts` — section/lyric anchors. **Single source of truth for time.**
- `src/Root.tsx` — composition (1920×1080 @ 30 fps, 211.8 s).
- `src/FullPV.tsx` — scene scheduler (`SCENES` array) + the "warmth" palette curve.
- `src/CharStage.tsx` — the character-grid stage: offscreen canvas composite,
  CRT glass overlay, shutdown-collapse.
- `src/engine/` — `grid.ts` (framebuffer + `Palette`), `song.ts` (MIDI JSON
  consumer: beat grid, kicks/snares, waveform), `deco.ts` (donut, heart,
  viewfinder, comment-block lyrics, pseudo-code rain, glitch), `rng.ts`
  (deterministic hash).
- `src/scenes/S00…S10` — one file per section (27 storyboard units).
- `docs/workflow/` — the human/agent production pipeline used to build this
  film (parallel-scene pipeline, designer & orchestrator prompts).

## Hard rules (violating any of these is a revert)

The full production contract behind these rules lives at
[docs/STYLE-CONTRACT.md](docs/STYLE-CONTRACT.md) — read it before
implementing or reviewing scene changes.

1. **Zero absolute seconds.** Every time window or anchor comes from
   `src/timeline.ts` exports; inside a scene, time is relative
   (`t = frame / fps`). Never invent a timestamp.
2. **Zero RNG.** All "randomness" goes through `src/engine/rng.ts`
   (seeded hash). Any frame must re-render bit-identical.
3. **Characters only.** No bitmap/image assets in the picture. Everything is
   drawn into the `Grid` framebuffer as monospace glyphs.
4. **Palette discipline.** Colors come from the 6-tier `Palette`
   (`bg/dim/mid/main/bright/accent` in `engine/grid.ts`) addressed by color
   index `ci` 0–5. Event colors are budgeted: large-area red appears exactly
   twice in the film (blood `#c00000`); system red `#ff5f56` is for small
   text events only. Do not introduce colors outside the palette.
5. **Scene isolation.** One section = one file in `src/scenes/`. Scenes never
   import each other; cross-section motifs are coordinated through storyboard
   change orders, not imports. Shared helpers live in `src/scenes/shared.ts`.
6. **Flash safety.** Every flash is a single frame, spaced ≥ 0.5 s from any
   other flash (photosensitivity red line — verified with ffmpeg
   `signalstats` before release).
7. **Scope discipline.** `out/` is never committed; generated assets and
   media are never committed; don't touch files outside the scene/area you
   were asked to change.

## Verification loop

```bash
node_modules/.bin/tsc --noEmit                       # must be clean
node_modules/.bin/remotion still src/index.ts FullPV out/probe.png --frame=N
npm run audit:grid -- <t,...> "<charset>"            # grid-level assertions, no render
```

After visual changes: render stills at ≥ 3 representative timestamps
(plus first/middle/last of the film for palette-wide changes), and compare
against the pre-change frames. Prefer `still` over `render` while iterating;
a full render is minutes — do it once at integration time, in the background.

## Dual-audio note

The timeline lives in "chiptune time". The official-vocal mix delays the
official recording by a measured lag (this project: +0.233 s, measured by
`scripts/align_official_audio.py`). When checking anchors against an
official-vocal render, convert times first — static elements hide the
offset, moving/flashing elements do not.

## Note for template seekers

`docs/workflow/` generalizes the multi-agent production pipeline used to
make this film into reusable templates (placeholders `{{...}}`, worked
example notes marked "例（本项目）"). If you want to produce your own video
with it, start from `docs/workflow/WORKFLOW-README.md`. When working in
THIS repository, the rules in this file always take precedence.
