"""Frame-audit toolkit for the phosphor-terminal PV.

Born from the queen-art case (docs/ascii-root-cause.md, rounds 4-5):
size/spacing feedback is settled with pixel measurements, and art
iterations get a same-metrics preview without booting Remotion.

Subcommands:
  bands    vertical ink bands of a frame — element positions and the
           gaps between them (the round-5 convergence measurements)
  bbox     bounding box of the dense central element — size claims
           become numbers before they reach the director
  preview  tiered phosphor render of a char-grid art at true Consolas
           stream metrics (advance 0.55em, line-height = font size)
  board    labeled side-by-side comparison board (the A/B evidence images)

Ink masks: default is the green-phosphor mask (G >> R,B). The red
accent ink (meBlock's blocks) is INVISIBLE to it — pass --any-ink to
measure any non-background pixel.

Run from the repository root:
  python scripts/audit_frame.py bands  out/ascii_probe/still.png --x0 760 --x1 1160
  python scripts/audit_frame.py bbox   out/ascii_probe/still.png --dense 60
  python scripts/audit_frame.py preview --fs 9 -o out/ascii_probe/preview.png
  python scripts/audit_frame.py board a.png b.png --labels "before|after" -o board.png
"""
import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

try:
    import numpy as np
except ImportError:
    sys.exit('audit_frame needs numpy: pip install numpy')

LABEL_FONT = 'C:/Windows/Fonts/consolab.ttf'
GRID_TS = Path('src/engine/grid.ts')
ICONS_TS = Path('src/scenes/intro_icons.ts')
# overlay() in S00Intro.ts maps tiers to these classes; keep in sync
TIER_CLASSES = [':;.-', '*+=', '@%#']


def load_mask(path: str, any_ink: bool, x0: int, x1: int):
    img = np.array(Image.open(path).convert('RGB')).astype(int)
    if any_ink:
        mask = img.sum(axis=2) > 45          # anything brighter than bg
    else:
        mask = ((img[:, :, 1] > img[:, :, 0] + 30)
                & (img[:, :, 1] > img[:, :, 2] + 30))
    if x1 <= x0:
        x0, x1 = 0, img.shape[1]
    return mask[:, x0:x1], x0


def row_bands(mask, min_ink):
    counts = mask.sum(axis=1)
    bands, start, in_band = [], 0, False
    for y, c in enumerate(counts):
        if c > min_ink and not in_band:
            start, in_band = y, True
        elif c <= min_ink and in_band:
            bands.append((start, y - 1))
            in_band = False
    if in_band:
        bands.append((start, len(counts) - 1))
    return bands, counts


def cmd_bands(args) -> None:
    mask, _ = load_mask(args.image, args.any_ink, args.x0, args.x1)
    bands, counts = row_bands(mask, args.min_ink)
    prev_end = None
    for s, e in bands:
        gap = f'  gap={s - prev_end - 1}px' if prev_end is not None else ''
        print(f'y {s:4d}-{e:4d}  h={e - s + 1:4d}{gap}')
        prev_end = e
    if len(bands) >= 2:
        pairs = zip(bands, bands[1:])
        print(f'{len(bands)} bands, largest gap '
              f'{max(nxt[0] - cur[1] - 1 for cur, nxt in pairs)}px')


def cmd_bbox(args) -> None:
    mask, dx = load_mask(args.image, args.any_ink, args.x0, args.x1)
    bands, counts = row_bands(mask, args.min_ink)
    dense = [b for b in bands if counts[b[0]:b[1] + 1].sum() / (b[1] - b[0] + 1) >= args.dense]
    if not dense:
        sys.exit('no band reaches --dense; lower it or widen --x0/--x1')
    y0, y1 = dense[0][0], dense[-1][1]
    colcounts = mask[y0:y1 + 1].sum(axis=0)
    cols = np.where(colcounts > args.colmin)[0]
    if len(cols) == 0:
        sys.exit('dense band(s) have no columns past --colmin')
    x0c, x1c = int(cols.min()), int(cols.max())
    print(f'{args.name}: {x1c - x0c + 1}x{y1 - y0 + 1}px at '
          f'x={x0c + dx}..{x1c + dx} y={y0}..{y1}')


def palette() -> dict:
    """Parse PHOSPHOR from src/engine/grid.ts (source of truth)."""
    pal = {'bg': '#040604', 'dim': '#1d4a2a', 'mid': '#3f8a52', 'main': '#7dff9a'}
    if GRID_TS.exists():
        src = GRID_TS.read_text(encoding='utf-8')
        for key in pal:
            m = re.search(rf"{key}:\s*'(#[0-9a-fA-F]{{6}})'", src)
            if m:
                pal[key] = m.group(1)
    return {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in pal.items()}


def load_art(spec: str) -> list[str]:
    """'intro_icons.ts::QUEEN_OVERLAY' (generated const) or a .txt file."""
    if '::' in spec:
        file, name = spec.split('::', 1)
        src = Path(file).read_text(encoding='utf-8')
        m = re.search(rf'export const {name} = \[(.*?)\];', src, re.S)
        if not m:
            sys.exit(f'const {name} not found in {file}')
        return re.findall(r'"([^"]*)"', m.group(1))
    return Path(spec).read_text(encoding='utf-8').splitlines()


def cmd_preview(args) -> None:
    art = [ln.rstrip() for ln in load_art(args.art) if ln.strip()]
    pal = palette()
    tiers = [(pal['dim'], TIER_CLASSES[0]), (pal['mid'], TIER_CLASSES[1]),
             (pal['main'], TIER_CLASSES[2])]
    adv, lh = args.fs * 0.55, args.fs
    scale = args.scale
    W = int((max(map(len, art)) * adv + 8) * scale)
    H = int((len(art) * lh + 8) * scale)
    img = Image.new('RGB', (W, H), pal['bg'])
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', args.fs * scale)
    for r, line in enumerate(art):
        for color, cls in tiers:
            masked = ''.join(ch if ch in cls else ' ' for ch in line)
            if masked.strip():
                d.text((4 * scale, (r * lh + 4) * scale), masked, font=f, fill=color)
    img.save(args.out)
    print(f'{args.out}: {img.size}, {len(art)} rows, fs={args.fs} '
          f'(grid px {max(map(len, art)) * adv:.0f}x{len(art) * lh:.0f})')


def cmd_board(args) -> None:
    labels = args.labels.split('|') if args.labels else [Path(p).name for p in args.images]
    H = args.height
    fits = []
    for p in args.images:
        im = Image.open(p).convert('RGB')
        fits.append(im.resize((int(im.width * H / im.height), H), Image.LANCZOS))
    pad, lbl = 30, 60
    W = sum(im.width for im in fits) + pad * (len(fits) + 1)
    board = Image.new('RGB', (W, H + lbl + pad * 2), (24, 24, 24))
    d = ImageDraw.Draw(board)
    f = ImageFont.truetype(LABEL_FONT, 28)
    x = pad
    for im, label in zip(fits, labels):
        board.paste(im, (x, lbl + pad))
        d.text((x, 18), label, font=f, fill=(255, 220, 120))
        x += im.width + pad
    board.save(args.out)
    print(f'{args.out}: {board.size}, {len(fits)} panels')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest='cmd', required=True)

    for name in ('bands', 'bbox'):
        p = sub.add_parser(name)
        p.add_argument('image')
        p.add_argument('--x0', type=int, default=0, help='restrict to columns >= x0')
        p.add_argument('--x1', type=int, default=0, help='restrict to columns < x1 (0 = full)')
        p.add_argument('--any-ink', action='store_true',
                       help='any non-background pixel (default: green phosphor only)')
        p.add_argument('--min-ink', type=int, default=3)
        if name == 'bbox':
            p.add_argument('--dense', type=int, default=60,
                           help='px per row for a band to count as the element')
            p.add_argument('--colmin', type=int, default=3)
            p.add_argument('--name', default='element')
        p.set_defaults(fn={'bands': cmd_bands, 'bbox': cmd_bbox}[name])

    p = sub.add_parser('preview')
    p.add_argument('--art', default=f'{ICONS_TS.as_posix()}::QUEEN_OVERLAY')
    p.add_argument('--fs', type=int, default=9, help='font size; overlay() is at 9')
    p.add_argument('--scale', type=int, default=5)
    p.add_argument('-o', '--out', default='out/ascii_probe/preview_tiered.png')
    p.set_defaults(fn=cmd_preview)

    p = sub.add_parser('board')
    p.add_argument('images', nargs='+')
    p.add_argument('--labels', help="'a|b|c', default: file names")
    p.add_argument('--height', type=int, default=900)
    p.add_argument('-o', '--out', default='out/ascii_probe/board.png')
    p.set_defaults(fn=cmd_board)

    args = ap.parse_args()
    args.fn(args)


if __name__ == '__main__':
    main()
