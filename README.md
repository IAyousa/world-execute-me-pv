<div align="center">

# world.execute(me); — Terminal Fan PV

**A frame-perfect fan music video for Mili's *world.execute(me);* — every pixel is a monospace glyph.**

[English](README.md) · [中文](README.zh-CN.md)

</div>

---

**English TL;DR** — A fan-made music video rendered entirely as a live phosphor-green character grid, built with [Remotion](https://www.remotion.dev): the video is written as React components, driven note-by-note by a MIDI-derived timeline. Ships two audio mixes: the official vocal track and a self-rendered chiptune synthesized from the same MIDI. **This repository contains no copyrighted material** — you bring your own MIDI and audio; scripts generate everything else. Read the [Legal notes](#legal-notes) first.

---

## Table of Contents

- [Legal notes](#legal-notes) ← **read this first**
- [Overview](#overview)
- [Tech stack & versions](#tech-stack--versions)
- [Quick start](#quick-start)
- [Official-vocal mix](#official-vocal-mix)
- [Repository layout](#repository-layout)
- [Dev & audit tooling](#dev--audit-tooling)
- [How this was made](#how-this-was-made)
- [References](#references)
- [Credits](#credits)
- [License](#license)

---

## Legal notes

1. **Unofficial fan work.** This project is not affiliated with, endorsed or authorized by Mili or Saihate Records. Please watch the [official MV](https://www.youtube.com/watch?v=ESx_hy1n7HA) and support official releases.
2. **No copyrighted material is distributed here**: no audio, no MIDI, no standalone lyric files. All rights to the song *world.execute(me);* belong to Mili (lyrics: Cassie Wei / momocashew; music: Yamato Kasai).
3. **Bring your own assets**: before running, place your own MIDI transcription of the song (community versions exist; 130 BPM, 4/4) into `public/` and generate the runtime assets with one command (see [Quick start](#quick-start)). Do **not** commit your audio or MIDI back to this repository (`.gitignore` blocks them).
4. Lyric fragments appearing in the source (`src/`) and documents
   (`docs/`) are integral parts of this audiovisual work and its production
   record (same nature as any lyric video), provided for viewing/studying
   this work only.
5. The **code** in this repository is MIT-licensed (see [LICENSE](LICENSE)); Mili-related copyrighted content is **not** covered by that license; documents under `docs/` are for study only.

## Overview

A tribute built inside a terminal. Highlights:

- **Everything is characters.** The film's only visual material is a monospace glyph grid at 1920×1080 — boot logs, geometry, still lifes (an eggplant, a tomato, a tabby cat), a donut spinning in the void, a heart surfacing in isolation, and a CRT power-off collapse at the end. Not a single bitmap pixel.
- **Frame-perfect, note-driven sync.** The MIDI is parsed into a note-level JSON timeline (`song.json`); the 130 BPM beat grid, kick pulses, and the vocal-line mirror (a single-note guitar track) all drive the visuals from data — nothing is timed by hand.
- **Two audio mixes.**
  - *Chiptune mix* — a WebAudio-style synthesizer rendered offline from the same MIDI; picture and sound share one data source, so sync is absolute by construction.
  - *Official-vocal mix* — the Mili recording, aligned to the picture by an onset cross-correlation script (measured lag for our transcription: +0.233 s, drift-free across the song).
- **A motif system that carries the story.** The `me` cube (constructed → dissolved → only its name left in the cage), one bar-vocabulary in two densities (the dense cage that holds `me` vs. the hollow gate that lets `you` through), a four-station "love line", and a red-event budget (large-area red appears exactly twice in the film). See [docs/storyboard.md](docs/storyboard.md) for the full shot-by-shot table.
- **Seizure-safe by design.** Every flash in the film is a single frame, spaced ≥ 0.5 s apart — verified numerically with ffmpeg `signalstats`.
- **Deterministic frames.** No random number calls anywhere; a seeded hash drives all "randomness", so any frame re-renders bit-identical.

## Tech stack & versions

| Component | Version | Role |
|---|---|---|
| [Remotion](https://remotion.dev) | ^4.0.532 | Video-as-React-components; frame-exact render / Studio preview |
| React / React-DOM | ^19.3.0 | Component model |
| TypeScript | ^7.0.2 | Full typecheck (`tsc --noEmit` clean is the merge bar) |
| Node.js | ≥ 20 (developed on 22.19) | Runtime |
| npm | 10.x | Package management |
| Python | 3.11 (needs `numpy`, `mido`) | MIDI → `song.json`; offline chiptune render → WAV |
| ffmpeg | ≥ 6 (developed on 8.0.1) | WAV→MP3, official-audio alignment analysis, muxing |

> Remotion major-version bumps may change APIs — staying within the ranges in `package.json` is safest.

## Quick start

```bash
git clone <this-repo> world-execute-me-pv
cd world-execute-me-pv
npm install
```

**1. Bring your own MIDI and generate the runtime assets**

Put your MIDI transcription of *world.execute(me);* into `public/` (or anywhere), then:

```bash
python tools/prepare_assets.py            # or: python tools/prepare_assets.py path/to/your.mid
```

This generates two git-ignored files:

- `public/song.json` — the note-level timeline (single source of truth for the engine)
- `public/chiptune.mp3` — the chiptune audio track (rendered from the same MIDI, in sync by construction)

> If your MIDI assigns instruments to different channels, pass your own
> channel→program map: `python scripts/render_chiptune_v2.py your.mid out.wav map.json`
> (see the `PROG` comment at the top of that script).

**2. Preview & render**

```bash
npm run studio                            # Remotion Studio live preview
npm run render                            # = npx remotion render src/index.ts FullPV out/FullPV.mp4
```

Output: 1920×1080 / 30 fps / 211.8 s, all 27 storyboard units included.

## Official-vocal mix

To use Mili's official recording instead of the chiptune (bring your own mp3; do **not** commit it):

```bash
# 1) Measure the offset: onset-envelope cross-correlation + per-segment drift check
python scripts/align_official_audio.py "world.execute (me) ;.mp3" public/chiptune.mp3
#    For our transcription this printed: full-song lag = +0.233 s, no drift

# 2) Render the picture against the chiptune (the timeline lives in chiptune time)
npx remotion render src/index.ts FullPV out/FullPV_chip.mp4

# 3) Mux: delay the official audio by the measured lag (ms)
ffmpeg -i out/FullPV_chip.mp4 -i "world.execute (me) ;.mp3" \
  -filter_complex "[1:a]adelay=233|233[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac out/FullPV_official.mp4
```

A different MIDI transcription may land on a different lag — trust step 1's measurement (the script also probes per-segment drift).

## Repository layout

```
├── src/
│   ├── Root.tsx / FullPV.tsx      # Remotion entry; scene scheduler + warmth palette curve
│   ├── CharStage.tsx              # char-grid stage: offscreen composite + CRT glass + shutdown collapse
│   ├── engine/
│   │   ├── song.ts                # song.json consumer: KICKS/SNARES/pulses/waveform synthesis
│   │   ├── grid.ts                # character framebuffer (Palette lives here)
│   │   ├── deco.ts                # donut/heart/viewfinder/comment-block lyrics/pseudo-code rain/glitch
│   │   └── rng.ts                 # deterministic hashing (bit-reproducible frames)
│   ├── scenes/S00…S10             # 27 storyboard units (intro→outro), one file per scene
│   └── timeline.ts                # section/lyric anchors (fan-LRC aligned, single source of truth)
├── scripts/                       # audio pipeline + audit tools (see below)
├── tools/prepare_assets.py        # MIDI → song.json + chiptune.mp3
├── docs/
│   ├── STORYBOARD-REFERENCE.md    # canonical 27-unit storyboard + narrative constitution
│   ├── STYLE-CONTRACT.md          # scene implementation hard rules (full contract)
│   ├── STORYBOARD-DELTA.md        # change-order template
│   ├── TIMELINE.md                # human-readable timeline mirror (truth: src/timeline.ts)
│   ├── ai-review-protocol.md      # verification discipline (discriminative questions, etc.)
│   ├── PILOT-REPORT.md            # pilot lessons: pitfall→clause table
│   ├── ascii-root-cause.md        # case study: why line-art sources fail
│   ├── ART-NOTES.md               # where the film's character art actually comes from (3 tiers)
│   ├── SCRIPTS.md                 # what every script does, with verified commands
│   ├── adr/                       # 15 architecture decision records
│   ├── storyboard.md              # early-phase lyric-driven shot table (superseded; kept as design history)
│   ├── DESIGN.md                  # inception design consensus (historical record)
│   ├── reference-analysis.md      # reference study: official MV + a fan lyric PV
│   └── workflow/                  # multi-agent collaboration workflow templates
└── public/                        # runtime assets (generated from your own MIDI; not committed)
```

## Dev & audit tooling

```bash
npm run audit:grid        # character-grid invariant audit (scripts/audit_grid.ts)
python scripts/audit_frame.py bands out/still.png      # frame audit: bands / bbox / preview / board
python scripts/qc/ab_board.py                          # review-package generators (edit the manifest rows per round)
python scripts/align_official_audio.py official.mp3 public/chiptune.mp3   # audio-offset measurement
```

Scene-code conventions (details in `docs/workflow/PARALLEL-SCENE-PIPELINE.md`):
**zero absolute seconds** (everything anchors to `timeline.ts`), **zero RNG calls**
(deterministic hashing keeps frames reproducible), and a **red-event budget**
(large-area red: exactly two moments in the film).

## How this was made

The project was directed by a human and executed by a cluster of AI agents over
11 review rounds — each round produced a storyboard change-order, an
independent pixel-level verification pass, and a signed-off review package.
`docs/workflow/` contains the designer/orchestrator prompt documents and the
parallel-scene pipeline contract, in case you want to replicate this
human-AI animation pipeline.

## References

- Official music video — Mili「world.execute(me);」:
  <https://www.youtube.com/watch?v=ESx_hy1n7HA>
- Fan lyric PV by Eodslv (a major visual-language reference for this project):
  <https://www.youtube.com/watch?v=cn4M-fH08XY>

## Credits

- **Mili** — *world.execute(me);*, from the album *Miracle Milk* (2016). Lyrics: Cassie Wei (momocashew); music: Yamato Kasai. All rights belong to Mili / Saihate Records.
- **Eodslv (땡닢)** — the 2017 fan lyric video referenced above; one of the visual-language sources for this project.
- Community research: Mili Wiki, Genius, and the GodDrinksJava transcription projects (origin of the 617 easter egg).

## License

The code is released under the [MIT License](LICENSE). **Note**: Mili's music, lyrics and trademarks are **not** covered by this license. If you publish a video produced with this project, follow your platform's rules for derivative/fan content and credit the original song.
