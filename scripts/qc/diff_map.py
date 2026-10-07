# 差异地图生成器（验收物料模板）：改前/改后帧的 红=删除 绿=新增
# 黄=变色 像素差异图。用法模式同 ab_board.py——清单/路径每轮替换，
# 本文件的配置是本项目试点轮的真实清单，保留作为填写范例。
# 差异地图：每对帧的红/绿/黄差异定位（叠在暗化基线上；验收物料标配）
# 红 = 基线有墨、改后没有（被删）；绿 = 改后有、基线没有（新增）；黄 = 都有但变了
# 输入: out/qc/pilot/_archive/  输出: out/pilot_review/diff_map.png
# 用法: python scripts/qc/diff_map.py   (工程根或任意目录均可)
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "out/qc/pilot/_archive"
DST = ROOT / "out/pilot_review"

rows = [
    ("ab_base_f891.png",  "VERSE1_f891.png",  "VERSE1 t=29.7  站1 点阵"),
    ("ab_base_f1005.png", "VERSE1_f1005.png", "VERSE1 t=33.5  站2 圆规"),
    ("ab_base_f1794.png", "CHORUS1_f1794.png", "CHORUS1 t=59.8  幕1 伪码雨"),
    ("ab_base_f2145.png", "CHORUS1_f2145.png", "CHORUS1 t=71.5  幕4 扭曲网格"),
    ("ab_base_f6270.png", "OUTRO_f6270.png",  "OUTRO t=209.0  尾屏打字中"),
    ("ab_base_f6353.png", "OUTRO_f6353.png",  "OUTRO t=211.77 片尾帧"),
]

TH_FULL, W_FULL = 1080, 1920
TW = 940
TH = round(TH_FULL * TW / W_FULL)

tiles = []
stats_all = []
for base, mod, label in rows:
    ia = Image.open(SRC / base).convert("RGB")
    ib = Image.open(SRC / mod).convert("RGB")
    pa, pb = ia.load(), ib.load()
    out = Image.new("RGB", (W_FULL, TH_FULL), (0, 0, 0))
    po = out.load()
    n_del = n_add = n_chg = 0
    for y in range(TH_FULL):
        for x in range(W_FULL):
            ra, ga, ba = pa[x, y]
            rb, gb, bb = pb[x, y]
            la = 0.3 * ra + 0.6 * ga + 0.1 * ba
            lb = 0.3 * rb + 0.6 * gb + 0.1 * bb
            if la > 25 and lb <= 25:
                po[x, y] = (255, 40, 40); n_del += 1        # 红：被删
            elif lb > 25 and la <= 25:
                po[x, y] = (60, 255, 90); n_add += 1        # 绿：新增
            elif la > 25 and lb > 25 and abs(ra - rb) + abs(ga - gb) + abs(ba - bb) > 45:
                po[x, y] = (255, 230, 60); n_chg += 1       # 黄：变色（如降档）
            else:
                po[x, y] = (ra // 5, ga // 5, ba // 5)       # 底：基线暗影
    stats_all.append((label, n_del, n_add, n_chg))
    tiles.append((label, out.resize((TW, TH), Image.LANCZOS)))

PAD, LBL = 10, 28
board = Image.new("RGB", (TW + 2 * PAD, len(rows) * (TH + LBL + PAD) + PAD), (8, 8, 8))
d = ImageDraw.Draw(board)
for i, (label, im) in enumerate(tiles):
    y = PAD + i * (TH + LBL + PAD)
    s = stats_all[i]
    d.text((PAD + 2, y + 6),
           f"{label}   R(del)={s[1]}  G(add)={s[2]}  Y(chg)={s[3]}",
           fill=(230, 230, 230))
    board.paste(im, (PAD, y + LBL))
DST.mkdir(parents=True, exist_ok=True)
board.save(DST / "diff_map.png")
print("saved", DST / "diff_map.png", board.size)
for label, nd, na, nc in stats_all:
    print(f"{label}: del={nd} add={na} chg={nc}")
