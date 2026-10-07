#!/usr/bin/env python3
"""Generate the two runtime assets this repo needs (bring-your-own MIDI):

    python tools/prepare_assets.py [path/to/world_execute_me.mid]

Produces (both git-ignored):
  1. public/song.json     — note-level timeline consumed by src/engine/song.ts
  2. public/chiptune.mp3  — offline chiptune render of the same MIDI (via ffmpeg)

The MIDI itself is NOT distributed with this repository — see README "Legal
notes". Any fan transcription of world.execute(me); at 130 BPM should work;
the timeline anchors in src/timeline.ts were derived against the community
transcription this project was built on.
"""
import glob
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
sys.path.insert(0, os.path.join(ROOT, "scripts"))


def find_midi(explicit: str | None) -> str | None:
    if explicit:
        return explicit if os.path.isfile(explicit) else None
    for pat in ("public/*.mid", "public/*.midi", "*.mid", "*.midi"):
        hits = sorted(glob.glob(os.path.join(ROOT, pat)))
        if hits:
            return hits[0]
    return None


def main() -> None:
    from midi_to_json import main as midi_to_json
    from render_chiptune_v2 import main as render_chiptune

    explicit = sys.argv[1] if len(sys.argv) > 1 else None
    midi = find_midi(explicit)
    if not midi:
        sys.exit(
            "MIDI not found. Place your own world_execute_me.mid in public/ "
            "(or pass its path as an argument). Do NOT commit it afterwards."
        )

    pub = os.path.join(ROOT, "public")
    os.makedirs(pub, exist_ok=True)

    song_json = os.path.join(pub, "song.json")
    midi_to_json(midi, song_json)

    wav = os.path.join(pub, "chiptune.wav")
    render_chiptune(midi, wav)

    mp3 = os.path.join(pub, "chiptune.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", wav,
         "-codec:a", "libmp3lame", "-b:a", "320k", mp3],
        check=True,
    )
    os.remove(wav)

    print("OK  ->", os.path.relpath(song_json, ROOT))
    print("OK  ->", os.path.relpath(mp3, ROOT))
    print("Next: npm run studio   (official-vocal mix: see README '官方人声版')")


if __name__ == "__main__":
    main()
