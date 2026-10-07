# General ASCII-art generator (model follows devkitlab-style tools):
#
# NOTE: this is the CONVERTER used when making new stills. It does NOT
# generate the art already in the film -- baked stills live as string
# arrays inside src/scenes/Sxx*.ts, and moving elements are drawn live
# in code. See docs/ART-NOTES.md for the three-tier breakdown.
#   input  = image file (any size) | text string | builtin shape
#   params = output width, charset preset, contrast, invert, cell aspect
# Mapping: per-cell brightness (0..1) -> position on the ramp.
# Dark background convention: brighter cell -> denser glyph (invert default ON).
# Output: TS array snippet for deco.ts + terminal preview (ground truth).
import argparse
import sys
import numpy as np

RAMPS = {
    'standard': '.,-~:;=!*#$@',
    'fine': ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
    'blocks': ' .-:▁▂▃▄▅▆▇█',
    'simple': ' .:-=+*#%@',
    'binary': ' .01',
    'minimal': ' #',
}
CELL_RATIO = 24 / 14  # monospace cell is taller than wide (CharStage 24px x ~14px)


def heart_f(x, y):
    return (x * x + y * y - 1) ** 3 - x * x * y ** 3


def tomato_b(X, Y):
    # squat sphere + 5-point star calyx + small upper-left glint
    body = (X / 1.02) ** 2 + ((Y + 0.10) / 0.90) ** 2 <= 1
    dx, dy = X - 0.0, Y - 1.02
    r = np.hypot(dx, dy)
    th = np.arctan2(dy, dx)
    star = r <= 0.44 * (0.45 + 0.55 * np.cos(5 * th))
    b = (body | star).astype(float)
    glint = (X + 0.48) ** 2 + (Y - 0.42) ** 2 <= 0.016
    b[glint] = 0.55
    return b


def eggplant_b(X, Y):
    # egg-shaped body (widest lower third, tapering to a round tip) +
    # overhanging cap + stem + small glint on the upper-left shoulder
    xc = 0.10 * np.sin((Y + 1.0) * 1.4)
    rx = 0.46 * np.sqrt(np.maximum(0.0, 1.0 - ((Y + 0.28) / 1.30) ** 2))
    body = (np.abs(X - xc) <= rx) & (Y > -1.16) & (Y < 1.02)
    cap = ((X - 0.10 * np.sin(1.95 * 1.4)) / 0.58) ** 2 + ((Y - 0.95) / 0.20) ** 2 <= 1
    stem = (np.abs(X - 0.10 * np.sin(2.1 * 1.4)) < 0.07) & (Y > 1.10) & (Y < 1.32)
    b = (body | cap | stem).astype(float)
    glint = ((X - xc) + 0.001) ** 2 * 0 + (X + 0.16) ** 2 + (Y - 0.28) ** 2 <= 0.016
    b[glint & (b > 0)] = 0.55
    return b


SHAPES = {
    'heart': ((-1.15, 1.15), (1.30, -1.05), lambda X, Y: (heart_f(X, Y) <= 0).astype(float)),
    'tomato': ((-1.25, 1.25), (1.55, -1.15), tomato_b),
    'eggplant': ((-0.85, 0.85), (1.35, -1.20), eggplant_b),
}


def shape_raster(shape, w, h):
    """supersampled brightness field for builtin shapes (no deps beyond numpy)"""
    ss = 6
    (x0, x1), (y0, y1) = SHAPES[shape][0], SHAPES[shape][1]
    xs = np.linspace(x0, x1, w * ss)
    ys = np.linspace(y0, y1, h * ss)
    X, Y = np.meshgrid(xs, ys)
    b = SHAPES[shape][2](X, Y)
    # box-downsample to w x h
    return b.reshape(h, ss, w, ss).mean(axis=(1, 3))


def image_raster(path):
    from PIL import Image
    im = Image.open(path).convert('L')
    return np.asarray(im, dtype=float) / 255.0


def text_raster(text, px=120, bold=True):
    from PIL import Image, ImageDraw, ImageFont
    try:
        font = ImageFont.truetype('consola.ttf', px)
    except OSError:
        font = ImageFont.load_default()
    im = Image.new('L', (px * (len(text) + 2), px * 3), 0)
    d = ImageDraw.Draw(im)
    d.text((px, px * 0.8), text, fill=255, font=font,
           stroke_width=max(1, px // 30) if bold else 0)
    return np.asarray(im, dtype=float) / 255.0


def convert(bright, width, ramp, contrast=1.0, invert=True):
    h, w = bright.shape
    cols = width
    rows = max(1, round(cols * (h / w) / CELL_RATIO))
    # area-average downsample
    r = bright[:rows * (h // rows), :cols * (w // cols)]
    if r.size == 0:  # image smaller than grid: nearest
        ys = np.linspace(0, h - 1, rows).astype(int)
        xs = np.linspace(0, w - 1, cols).astype(int)
        cells = bright[np.ix_(ys, xs)]
    else:
        cells = r.reshape(rows, h // rows, cols, w // cols).mean(axis=(1, 3))
    c = np.clip((cells - 0.5) * contrast + 0.5, 0, 1)
    if invert:  # dark background: brighter -> denser glyph
        c = 1 - c
    idx = np.round(c * (len(ramp) - 1)).astype(int)
    return [''.join(ramp[i] for i in row) for row in idx]


def emit_ts(rows):
    print('# TS array snippet:')
    print('const ART = [')
    for r in rows:
        print(f"  '{r}',")
    print('];')
    print()
    print('# terminal preview (ground truth):')
    for r in rows:
        print(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', help='image file')
    ap.add_argument('--text', help='text to render')
    ap.add_argument('--shape', help='builtin shape, e.g. heart')
    ap.add_argument('--width', type=int, default=80)
    ap.add_argument('--ramp', default='standard', choices=RAMPS)
    ap.add_argument('--contrast', type=float, default=1.0)
    ap.add_argument('--no-invert', action='store_true')
    a = ap.parse_args()

    if a.input:
        bright = image_raster(a.input)
    elif a.text:
        bright = text_raster(a.text)
    elif a.shape:
        # raster in pure math aspect; the cell-aspect correction happens
        # exactly once, inside convert() — doing it here too squashes the art
        cols0 = max(a.width * 6, 240)
        (x0, x1), (y0, y1) = SHAPES[a.shape][0], SHAPES[a.shape][1]
        rows0 = int(cols0 * ((y0 - y1) / (x1 - x0)))
        bright = shape_raster(a.shape, cols0, rows0)
    else:
        ap.error('need --input, --text or --shape')

    rows = convert(bright, a.width, RAMPS[a.ramp], a.contrast, not a.no_invert)
    emit_ts(rows)


if __name__ == '__main__':
    main()
