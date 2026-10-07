# A/B 对照板生成器（验收物料模板）：基线 vs 改后同帧并排。
# 用法模式：每轮把 rows 清单与 SRC/DST 换成当轮的帧——本文件的 rows
# 是本项目试点轮的真实清单，保留作为填写范例。
# A/B 对照板：基线 vs 改后，同帧并排（验收物料标配，PIPELINE P4）
# 输入: out/qc/pilot/_archive/  输出: out/pilot_review/ab_board.png
# 用法: python scripts/qc/ab_board.py   (工程根或任意目录均可)
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "out/qc/pilot/_archive"
DST = ROOT / "out/pilot_review"

# (基线帧, 改后帧, 标签, 差异说明, 可见性分级)
rows = [
    ("ab_base_f891.png",  "VERSE1_f891.png",  "VERSE1 t=29.7 站1点阵",
     "点数 14 vs 44（3.2x）", "可辨：中部散点更密"),
    ("ab_base_f1005.png", "VERSE1_f1005.png", "VERSE1 t=33.5 站2圆规",
     "描线 ~1% vs ~14%", "可辨：改后弧线已成形"),
    ("ab_base_f1794.png", "CHORUS1_f1794.png", "CHORUS1 t=59.8 幕1伪码雨",
     "背景雨字符 76 vs 51 (-33%)", "阈值级：dim 档背景纹理，需盯背景看"),
    ("ab_base_f2145.png", "CHORUS1_f2145.png", "CHORUS1 t=71.5 幕4网格",
     "网格点 559 vs 458 (-18%)", "阈值级：全屏网眼略宽"),
    ("ab_base_f6270.png", "OUTRO_f6270.png",  "OUTRO t=209.0 尾屏",
     "p95亮度 110 vs 57 (mid->dim)", "可辨：下行文字明显更暗"),
    ("ab_base_f6353.png", "OUTRO_f6353.png",  "OUTRO t=211.77 片尾帧",
     "全黑 vs 定格两行文字", "极易辨：黑屏 vs 墓碑式定格"),
]

TW = 940
TH = round(1080 * TW / 1920)
PAD, LBL = 10, 30
W = 2 * TW + 3 * PAD
H = len(rows) * (TH + LBL + PAD) + PAD
board = Image.new("RGB", (W, H), (8, 8, 8))
d = ImageDraw.Draw(board)

for i, (base, mod, label, diff, vis) in enumerate(rows):
    y = PAD + i * (TH + LBL + PAD)
    d.text((PAD + 2, y + 6), f"{label}   |   {diff}   |   {vis}", fill=(220, 220, 220))
    a = Image.open(SRC / base).convert("RGB").resize((TW, TH), Image.LANCZOS)
    b = Image.open(SRC / mod).convert("RGB").resize((TW, TH), Image.LANCZOS)
    board.paste(a, (PAD, y + LBL))
    board.paste(b, (PAD * 2 + TW, y + LBL))
    d.text((PAD + 4, y + LBL + 4), "BASELINE v17", fill=(255, 120, 120))
    d.text((PAD * 2 + TW + 4, y + LBL + 4), "MODIFIED r1", fill=(120, 255, 140))

DST.mkdir(parents=True, exist_ok=True)
board.save(DST / "ab_board.png")
print("saved", DST / "ab_board.png", board.size)

# 数字自证：逐行算两帧的 ink 像素差（防"拼错图"的静默错误）
for base, mod, label, diff, vis in rows:
    ia = Image.open(SRC / base).convert("RGB").load()
    ib = Image.open(SRC / mod).convert("RGB").load()
    changed = sum(1 for y in range(0, 1080, 4) for x in range(0, 1920, 4)
                  if abs(ia[x, y][0] - ib[x, y][0]) + abs(ia[x, y][1] - ib[x, y][1]) + abs(ia[x, y][2] - ib[x, y][2]) > 30)
    total = (1080 // 4) * (1920 // 4)
    print(f"{label}: changed_px(sampled)={changed} ({100 * changed / total:.2f}%)")
