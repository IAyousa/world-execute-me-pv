# 脚本功能一览（SCRIPTS）

> 本仓库的脚本分两组：`tools/` 把你自备的 MIDI 变成可运行的资产；
> `scripts/` 是音频管线、帧级审计、验收物料生成与艺术转换器。
> 所有命令默认在**仓库根目录**执行。逐轮迭代的协作用法见
> [workflow/](workflow/WORKFLOW-README.md)。

## 总览

| 脚本 | 一句话 | 典型调用 |
|---|---|---|
| `tools/prepare_assets.py` | 一键生成运行时资产 | `python tools/prepare_assets.py [your.mid]` |
| `tools/midi_to_json.py` | MIDI → 音符级时间轴 JSON | 由上者调用，也可单独跑 |
| `scripts/render_chiptune_v2.py` | 芯片音乐离线渲染 | `python scripts/render_chiptune_v2.py in.mid out.wav [map.json]` |
| `scripts/align_official_audio.py` | 双音源偏移实测 | `python scripts/align_official_audio.py official.mp3 public/chiptune.mp3` |
| `scripts/audit_grid.ts` | 网格级免渲染断言（秒级） | `npm run audit:grid -- 117.8,159.4 "┌┐└┘·" "29,32"` |
| `scripts/audit_frame.py` | 帧级像素审计与预览 | `python scripts/audit_frame.py bands out/still.png` |
| `scripts/ascii_art.py` | 通用字符画转换器 | `python scripts/ascii_art.py --input img.png --width 80` |
| `scripts/qc/ab_board.py` | A/B 对照板生成 | `python scripts/qc/ab_board.py`（先改清单） |
| `scripts/qc/diff_map.py` | 前后帧差异地图 | `python scripts/qc/diff_map.py`（先改清单） |
| `scripts/qc/patrol_gate6.py` | 一致性巡检板 + 调色越界统计 | `python scripts/qc/patrol_gate6.py`（先改清单） |

---

## tools/ — 运行时资产生成

### `prepare_assets.py`
唯一需要记住的入口：把《world.execute(me);》的自备 MIDI 变成
`public/song.json`（时间轴）+ `public/chiptune.mp3`（音轨），内部依次调用
下面两个模块再经 ffmpeg 压 MP3。生成的文件被 `.gitignore` 拦截，勿提交。

### `midi_to_json.py`
MIDI 解析器： tempo 表换算 + 音符配对 → `[t, d, pitch, velocity, channel]`
行集。输出被 `src/engine/song.ts` 逐帧消费——节拍网格、鼓点脉冲、
波形合成全部源于它。

## scripts/ — 音频管线

### `render_chiptune_v2.py`
芯片音乐合成器：三角波贝斯 / 方波主旋律 / 锯齿吉他与弦乐 + 噪声鼓组，
离线渲染整曲到 WAV（峰值归一，无饱和失真）。**通道→音色映射 `PROG`
按你的 MIDI 调整**——直接改脚本顶部的表，或传第三个参数：
`render_chiptune_v2.py in.mid out.wav my_map.json`（`{"0": 33, ...}`）。

### `align_official_audio.py`
官方人声版对齐器：对官方录音与芯片音轨做 onset 包络互相关，输出全曲
最优滞后与每 40s 分段漂移抽查（同一滞后 = 无速度漂移）。测得的秒数
就是 ffmpeg 合流时 `adelay` 的毫秒数——见 README"官方人声版"。

## scripts/ — 帧与网格审计

> 前提：审计脚本读取 `public/song.json`（场景调度依赖它），新 clone
> 先跑一遍 `python tools/prepare_assets.py` 再用本节命令。

### `audit_grid.ts`（`npm run audit:grid`）
**免渲染断言**：直接调用真实场景绘制函数跑指定时刻，报告目标字符落在
哪些格——秒级反馈，改时序/位置时的第一反应工具。
参数：`时刻列表` + 目标字符集（默认取景框角标）+ 可选行过滤。
内置 147×45 的真实网格度量（ADR-0014，改字体后需重测）。

### `audit_frame.py`
渲染后帧的像素级审计，四个子命令：
- `bands <img>` — 行间距律（字符行是否均匀落地）
- `bbox <img> --name x --dense 60` — 元素尺寸律（改大改小是否真的变了）
- `preview --fs 9 -o out.png` — 字符画廉价 mockup（不启动 Remotion）
- `board a.png b.png -o out/ab.png` — 两帧并排对比板
`--x0/--x1` 可限定列范围。尺寸/间距类反馈一律以它的实测数字收口。

## scripts/ — QC 验收物料（每轮编辑清单的模板）

三个脚本的 PIL 逻辑通用，**清单是每轮的编辑点**：打开文件替换
`SRC/DST` 路径与 rows 配置（现存配置是本项目试点轮的真实实例，
保留作填写范例）。输入是当轮渲染的 still 帧，输出进验收包目录：
- `ab_board.py` — 基线 vs 改后同帧并排（附差异说明与可见性分级）
- `diff_map.py` — 红删/绿增/黄变色像素差异地图
- `patrol_gate6.py` — 三段代表帧×邻段参照巡检板 + 非调色板色像素统计

## scripts/ — 艺术转换器

### `ascii_art.py`
图片/文本/内置形状 → 字符栅格（TS 数组片段 + 终端预览）。参数：
`--width`（输出列数）、`--ramp`（字符梯度预设）、`--contrast`、
`--no-invert`（浅底专用）。**注意**：它不生成本片已有素材——成片
字符画的完整来源说明见 [ART-NOTES.md](ART-NOTES.md)。

---

## 三条典型工作流

**① 换一份 MIDI**：`prepare_assets.py your.mid` → `npm run studio` 听/看
→ 若通道映射不同，按提示给 `render_chiptune_v2.py` 传自定义 map →
`align_official_audio.py` 重测官方版偏移。

**② 做一个新静物**：画底稿（PIL 多边形 / 图片）→ `ascii_art.py --input`
转换 → 贴入对应场景文件的字符串数组（数组即素材本体，
[ART-NOTES.md](ART-NOTES.md)）→ `audit_frame.py preview` 校对。

**③ 改一个场景之后**：`tsc --noEmit` → `remotion still` 抽 3 帧 →
`audit:grid` 查落点 / `audit_frame.py` 查间距尺寸 → 有对照需求再上
qc 三件套生成验收物料（完整门禁见
[workflow/PARALLEL-SCENE-PIPELINE.md](workflow/PARALLEL-SCENE-PIPELINE.md) §5）。
