# ASCII 字符画"蚊香"问题 · 根因分析

> 2026-10-05。专案背景见 `HANDOFF-queen-art.md`（v9–v14 迭代史）。
> 本文是独立复现实验 + 证据链，结论：**源字形从来就不是皇后**。
> **状态：已结案**——同日五轮迭代后导演定稿 v5（见文末"定稿"节）。

## TL;DR

**`C:/Windows/Fonts/pala.ttf`（Palatino Linotype）里根本没有 U+265B（♛）。**
PIL/FreeType 对缺字码点静默渲染 `.notdef` 回退字形，而 Palatino
Linotype 的 `.notdef` 是一个**螺旋装饰符**。所以 v9 起所有"皇后字符画"
都是把一只螺旋降采样后的产物——导演判"蚊香"，判得完全正确，
因为源图**就是**一只蚊香。

## 证据链（全部可复现）

1. **cmap 为空**：`fontTools` 读 pala.ttf，U+2600–2700 区间 0 个码点。
   国际象棋六件套（U+2654–265F）一个都没有。
2. **回退一致**：pala.ttf 下 `getmask('♛')`、`getmask('🦄')`、
   `getmask('\uFFFF')` 的 bbox 完全相同 `(12, 0, 203, 198)`——
   三个"不同字符"渲染的是同一个 `.notdef`。
3. **渲染成像**：800px 大图渲染该"♛"→ 视觉判定为粗墨螺旋带，
   与 `QUEEN_OVERLAY` 旧版 art（intro_icons.ts 备份）的螺旋形状吻合。
   A/B 实验中 pala 源在 83 列下生成的字符画就是一只大螺旋
   （`scripts/ascii_site_style.py --font pala`，density 45%）。

## 为什么之前六轮都没发现

- **生成端人查**："脚本 stdout 是清晰皇后"——期望引导（知道要看皇后，
  螺旋轮廓被脑补成冠拱）。交接文档记载的"矛盾点"（视觉模型判
  "五拱齿可数" vs 导演判蚊香）同理：静态图 + 期望 = 集体幻觉。
- **FreeType 的静默回退**：缺字不报错、不警告，产出"某个字形"。
  字形还是螺旋而非通常的方框（.notdef 常见是空框），更难起疑。
- v10/v12 的照片剪影路线没踩这个坑（源是照片），但冠型不像 ♛，
  属于第二个独立问题（见下）。

## 网站生成器是怎么做的（调研结论）

标准管线（devkitlab 等所有在线生成器一致，参见
[Jonathan Petitcolas 的经典教程](https://www.jonathan-petitcolas.com/blog/2019/11/01/creating-ascii-art-from-any-image.html)）：

1. 转灰度；
2. LANCZOS 直接缩放到目标字符网格，行数乘**字符格宽高比修正**
   （终端字符约 2:1，即 `rows = h/w * cols * 0.5`）；
3. 每格**平均亮度**量化到 10 级左右字符坡道（暗→`@%#*+=-:. `→空格）。

对照 `website_gen.png`（导演基准）：83 列 × 37 行、非空格密度 76%、
实心块面 + 五齿带珠。用 Segoe UI Symbol 的 ♛（宽高 640:596 ≈ 1.07，
实心，墨量 48%）代入该管线：`1.07 / 0.5 ≈ 2.15 ≈ 83/37`——网格比
对得上，基本可断定导演喂给网站的就是 Segoe UI Symbol 渲染的 ♛ 截图
（Windows 下浏览器显示 ♛ 的默认回退字体正是它）。

## 本机字体普查结论

221 个字体文件里，绝大多数对 U+265B 返回回退框/问号。真正的 ♛ 只有两处：

- `pala.ttf`：无此码点，`.notdef` = 螺旋（事故根源）；
- `seguisym.ttf`（Segoe UI Symbol）：**实心、五齿带珠、1.07 宽高比**——
  理想源，也正是网站基准的观感来源。

## 修复（已完成，待导演验收）

| 项 | 改动 |
|---|---|
| 源字形 | `install_intro_icons.py` QUEEN_OVERLAY 改用 seguisym ♛ |
| 采样 | 弃 coverage 采样，改网站式亮度坡道（新脚本 `scripts/ascii_site_style.py`，`image_to_ascii`，char_aspect=0.55 = Consolas 流式渲染的 advance:lineHeight） |
| 防呆 | `glyph_drawer`/`glyph_image` 加 `.notdef` 断言：缺码点直接 raise，绝不再静默回退 |
| 渲染 | `S00Intro.ts` overlay 分色 CLASSES 补 `-`（新坡道含 `-`，否则整字被丢弃） |

产物：QUEEN_OVERLAY 43 行 × 83 列，非空格密度 59%（网站 76%），
五齿带珠、通体块面。Remotion 真帧 t=5.5s 与 4.7s mp4 已渲染：

- `out/ascii_probe/compare_board.png` —— 旧螺旋 | 网站基准 | 新皇后 三联对比
- `out/ascii_probe/preview_new_queen_tiered.png` —— 三层磷光分色渲染
- `out/ascii_probe/still_L2_t55.png` / `intro_L2_new.mp4` —— 导演验收用

### 第二轮反馈（同日）：小冠 + 棋子整体感

导演认可消除蚊香后的效果，追加要求：冠缩小、整体读作一枚
国际象棋棋子（冠与棋子主体拼合成形）。seguisym 字形本身冠占
~70% 高度，不满足；改为 `draw_queen_piece()` 矢量源（Staunton
比例）：小号五齿带珠冠（顶部 ~28%）、领圈环、内凹锥形杆、
喇叭底 + 底座环纹（车削感），1600×2000 实心剪影走同一亮度
采样管线，产出 44 行 × 52 列（v2 物料：`preview_queen_v2_tiered.png`、
`compare_board_v2.png`、`still_L2_v2_t55.png`、`intro_L2_v2.mp4`）。
经验：底座两条环纹在 ~8 行高的底座上渲染成斑马纹，只留一条；
杆/喇叭交界环纹读作领圈，符合 Staunton 观感。想换回大冠字形，
`QUEEN_OVERLAY_SPEC` 改 `('C:/Windows/Fonts/seguisym.ttf', 83, 0.55)`。

### 第三轮反馈（同日深夜）：冠再小 + 对齐主体直径 + 整体缩小

v3：冠带宽 0.38w→0.27w，且与领圈**齐宽不悬挑**（导演说的"和棋子
主体直径对齐"）；画布 1600×1760 → 39 行×44 列（渲染 339×546px，
高度 -11%），给歌词留出明显净空。新增经验：**凹槽纹路要收窄到
~1/3 行高并对齐行中心**——行高的纹路在 LANCZOS 下会出血到相邻行，
两条浅行在窄杆处读作"断口"。物料 v3：`preview_queen_v3_tiered.png`、
`still_L2_v3_t55.png`、`intro_L2_v3.mp4`。

### 第四轮反馈：缩小走渲染字号，不走砍行数

导演指出 v3"没变小"——v2→v3 仅砍行数（616→546px，-11%），低于
感知阈值。v4 改 overlay FS 14→11px，形状/网格不动，实测 337×538
→264×424px（线性 -22%）。

### 第五轮反馈（定稿）：再小一档 + 与 me 元素竖直成组

v5：FS 11→9（皇后 346px 高）、yT 130→160；me 构造行 33→24 行、
meBlock 36→27 行。皇后底↔me 行间距 244→70px。**导演定稿。**

## 定稿快照（2026-10-05）

- 生成端：`scripts/install_intro_icons.py`（`draw_queen_piece()` +
  `QUEEN_OVERLAY_SPEC = ('vector', 64, 0.55)`，含 .notdef 防呆）
  → `src/scenes/intro_icons.ts` QUEEN_OVERLAY 39 行×44 列
- 渲染端：`src/scenes/S00Intro.ts` overlay() FS=9、yT=160、
  CLASSES 含 `-`；me 构造行 24 行、meBlock 27 行
- 基准物料：`out/ascii_probe/still_L2_v5_t60.png`、
  `intro_L2_v5.mp4`；`tsc --noEmit` 通过

## 沉淀的可复用资产

- `scripts/ascii_site_style.py` —— 网站式生成器（`image_to_ascii`
  通用转换 + `glyph_image` 带 .notdef 防呆 + `--census` 字体普查）
- `scripts/audit_frame.py` —— 帧审计（bbox/bands 像素实测、preview
  廉价预览、board 对比板），第 4/5 轮的测量即出自这套方法
- `scripts/install_intro_icons.py::draw_queen_piece` —— 参数化
  Staunton 皇后矢量抽屉
- `docs/ai-review-protocol.md` —— 本案沉淀的 AI 复核使用规约

## 通用教训

1. **字体渲染必须验证码点存在性**——FreeType 的 `.notdef` 回退是静默的，
   而且（如 Palatino）可能长得还挺好看出人意料。空框判定：
   与已知缺字码点（`\uFFFF`）的 mask bbox 相同即为回退。
2. **验收主体的期望会污染判读**：知道"该是皇后"的人/模型看螺旋会数出
   "五拱齿"。无提示盲测（导演看动态视频恰是盲测）才是真信号。
3. ASCII 字符画要**实心剪影源**：即使字体真有 ♛，西文字库的棋子多为
   细线稿（"engraved"风格），低分辨率采样后仍是细线盘绕。实心源
   + 亮度坡道 = 网站质感。
4. 渲染端经验不变：canvas 必须整行 fillText 文本流，采样 cell 比例
   必须等于渲染 advance:lineHeight（v13/v14 的教训依然成立）。
