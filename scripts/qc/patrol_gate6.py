# 门禁巡检板生成器（验收物料模板）：三段代表帧×邻段参照并排 +
# 调色越界像素统计。rows 每轮替换（本文件原注即"单元轮次更换时
# 改这两行即可"）；现存清单为本项目试点轮实例，保留作为填写范例。
# 门禁6一致性巡检：并排 board（三段代表帧 × 邻段参照）+ 调色越界像素统计
# 输入: out/qc/pilot/_archive/  输出: out/pilot_review/gate6_board.png（巡检证据归档）
# 用法: python scripts/qc/patrol_gate6.py   (工程根或任意目录均可)
from pathlib import Path
from PIL import Image, ImageDraw
import colorsys

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "out/qc/pilot/_archive"
DST = ROOT / "out/pilot_review"

# 行1: 改动段代表帧; 行2: 邻段参照(未动)。单元轮次更换时改这两行即可。
row1 = [("VERSE1_r1 t29.7", "VERSE1_f891.png"),
        ("CHORUS1_r1 t71.5", "CHORUS1_f2145.png"),
        ("OUTRO_r1 t210.5", "OUTRO_f6315.png")]
row2 = [("adj prec1 t46", "adj_prec1_f1380.png"),
        ("adj verse2 t79", "adj_verse2_f2370.png"),
        ("adj chorus4 t189.5", "adj_chorus4_f5685.png")]

TW = 620
tiles = []
for label, fn in row1 + row2:
    im = Image.open(SRC / fn).convert("RGB")
    th = round(im.height * TW / im.width)
    tiles.append((label, im.resize((TW, th), Image.LANCZOS)))

TH = max(im.height for _, im in tiles)
PAD, LBL = 8, 26
board = Image.new("RGB", (3 * TW + 4 * PAD, 2 * (TH + LBL) + 3 * PAD), (10, 10, 10))
d = ImageDraw.Draw(board)
for i, (label, im) in enumerate(tiles):
    r, c = divmod(i, 3)
    x = PAD + c * (TW + PAD)
    y = PAD + r * (TH + LBL + PAD)
    d.text((x + 2, y + 4), label, fill=(200, 200, 200))
    board.paste(im, (x, y + LBL))
DST.mkdir(parents=True, exist_ok=True)
board.save(DST / "gate6_board.png")
print("board saved:", DST / "gate6_board.png", board.size)

# 调色越界统计：合法色相 = 绿->琥珀族 [40,160]，红 accent [345,15] 合法但计数上报
for label, fn in row1:
    im = Image.open(SRC / fn).convert("RGB")
    px = im.load()
    n_ink = n_ok = n_red = n_bad = 0
    bad_samples = []
    for y in range(0, im.height, 2):
        for x in range(0, im.width, 2):
            r, g, b = px[x, y]
            luma = 0.3 * r + 0.6 * g + 0.1 * b
            if luma < 8:
                continue
            n_ink += 1
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            deg = h * 360
            if 40 <= deg <= 160:
                n_ok += 1
            elif deg >= 345 or deg <= 15:
                n_red += 1
            else:
                n_bad += 1
                if len(bad_samples) < 5:
                    bad_samples.append((x, y, (r, g, b), round(deg)))
    print(f"{label}: ink={n_ink} green-amber={n_ok} red={n_red} OUT-OF-PALETTE={n_bad} {bad_samples}")
