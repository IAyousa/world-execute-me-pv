<div align="center">

# world.execute(me); — 终端粉丝 PV

**为 Mili 的《world.execute(me);》逐帧制作的同人音乐视频——画面上的每一个像素都是等宽字符。**

[English](README.md) · [中文](README.zh-CN.md)

</div>

---

**中文速览** —— 一部完全以"活的磷光绿字符栅格"渲染的同人 PV，基于 [Remotion](https://www.remotion.dev) 构建：视频本身是 React 组件，由 MIDI 解析出的时间轴逐音符驱动。提供双音源版本：官方人声版与自渲染芯片音乐版。**本仓库不含任何受版权保护的素材**——MIDI 与音频需自备，其余一切由脚本生成。请先阅读[法律声明](#法律声明)。

---

## 目录

- [法律声明](#法律声明) ← **请先阅读**
- [简介](#简介)
- [技术栈与版本](#技术栈与版本)
- [快速开始](#快速开始)
- [官方人声版](#官方人声版)
- [仓库结构](#仓库结构)
- [开发与审计工具](#开发与审计工具)
- [制作过程](#制作过程)
- [参考作品](#参考作品)
- [致谢](#致谢)
- [授权](#授权)

---

## 法律声明

1. **非官方同人作品**。本项目与 Mili 乐队、Saihate Records 厂牌无任何关联，未经授权，亦不构成背书。请观看[官方 MV](https://www.youtube.com/watch?v=ESx_hy1n7HA) 并支持官方发行。
2. **本仓库不分发任何受版权保护的素材**：不含音频、不含 MIDI、不含独立歌词文件。《world.execute(me);》词曲的一切权利归 Mili 所有（作词：Cassie Wei / momocashew；作曲：Yamato Kasai）。
3. **素材自备（bring your own assets）**：运行前请自备一份《world.execute(me);》的 MIDI 转录（社区有公开版本；130 BPM、4/4 拍），放入 `public/` 后用一条命令生成运行时资产（见[快速开始](#快速开始)）。自备的音频与 MIDI **请勿提交回本仓库**（`.gitignore` 已拦截相关扩展名）。
4. `src/` 源码与 `docs/` 文档中出现的歌词片段，是这部视听作品及其制作记录本身的组成文本（与一切歌词视频同性质），仅供配合本作品的观赏与学习使用。
5. 本仓库的**代码**以 MIT 协议授权（见 [LICENSE](LICENSE)）；与 Mili 相关的版权内容**不在**该协议覆盖范围内；`docs/` 下的文档仅供学习参考。

## 简介

一座建在终端里的纪念碑。几个要点：

- **一切皆字符。** 全片唯一的视觉材质是 1920×1080 的等宽字符栅格——开机日志、几何图形、静物（茄子、番茄、虎斑猫）、虚空中旋转的甜甜圈、隔离中浮现的字符心，以及终幕的 CRT 关机坍缩。没有一个位图像素。
- **逐音符驱动的音画同步。** MIDI 被解析成音符级时间轴（`song.json`）；130 BPM 节拍网格、底鼓脉冲、人声旋律镜像（吉他单音轨）全部由数据驱动画面——没有一个镜头靠人工对拍。
- **双音源版本。**
  - *芯片音乐版*——用 WebAudio 风格的合成器从同一份 MIDI 离线渲染；画面与声音共享同一数据源，同步是结构性的、绝对的。
  - *官方人声版*——Mili 官方录音，经 onset 包络互相关脚本自动对齐画面（我们这份转录的实测滞后：+0.233 秒，全曲无漂移）。
- **一套承载叙事的母题系统。** `me` 方块（被构造 → 被溶解 → 笼中只剩名字）、同一栏形语汇的两种密度（困住 `me` 的密笼 vs 放 `you` 通过的空门）、贯穿四站的"love 线"，以及红事件预算（大面积红全片仅出现两次）。完整的逐镜头分镜表见 [docs/storyboard.md](docs/storyboard.md)。
- **光敏安全是设计出来的。** 全片所有闪烁均为单帧、间隔 ≥ 0.5 秒——已用 ffmpeg `signalstats` 做过数值验证。
- **逐帧确定性。** 全工程没有一处随机数调用；一切"随机"由带种子的哈希驱动，任意一帧都能逐位复现。

## 技术栈与版本

| 组件 | 版本 | 用途 |
|---|---|---|
| [Remotion](https://remotion.dev) | ^4.0.532 | 视频即 React 组件；逐帧渲染 / Studio 实时预览 |
| React / React-DOM | ^19.3.0 | 组件模型 |
| TypeScript | ^7.0.2 | 全量类型检查（`tsc --noEmit` 零错误为合并门槛） |
| Node.js | ≥ 20（开发环境 22.19） | 运行时 |
| npm | 10.x | 依赖管理 |
| Python | 3.11（需 `numpy`、`mido`） | MIDI → `song.json`；芯片音乐离线渲染 → WAV |
| ffmpeg | ≥ 6（开发环境 8.0.1） | WAV→MP3、官方音频对齐分析、音画合流 |

> Remotion 大版本升级可能改动 API——锁定在 `package.json` 的版本区间内最稳妥。

## 快速开始

```bash
git clone <本仓库> world-execute-me-pv
cd world-execute-me-pv
npm install
```

**1. 自备 MIDI 并生成运行时资产**

把《world.execute(me);》的 MIDI 转录放进 `public/`（或任意位置），然后：

```bash
python tools/prepare_assets.py            # 或显式指定：python tools/prepare_assets.py 路径/xxx.mid
```

这一步会生成两个被 `.gitignore` 拦截的文件：

- `public/song.json` —— 音符级时间轴（引擎的单一事实来源）
- `public/chiptune.mp3` —— 芯片音乐音轨（从同一份 MIDI 渲染，结构性同步）

> 若你的 MIDI 通道分配与我们的转录不同，请传入自己的通道→音色映射：
> `python scripts/render_chiptune_v2.py your.mid out.wav map.json`
> （见该脚本头部 `PROG` 注释）。

**2. 预览与出片**

```bash
npm run studio                            # Remotion Studio 实时预览
npm run render                            # 等价于：npx remotion render src/index.ts FullPV out/FullPV.mp4
```

成品规格：1920×1080 / 30fps / 211.8 秒，包含全部 27 个分镜单元。

## 官方人声版

想用 Mili 官方录音替代芯片音轨时（自备 mp3；**勿提交**）：

```bash
# 1) 测偏移：onset 包络互相关 + 分段漂移抽查
python scripts/align_official_audio.py "world.execute (me) ;.mp3" public/chiptune.mp3
#    我们这份转录的实测结果：全曲 lag = +0.233s，无漂移

# 2) 以芯片音轨为基准渲染画面（时间轴定义在芯片域）
npx remotion render src/index.ts FullPV out/FullPV_chip.mp4

# 3) 合流：官方音频按实测滞后（毫秒）延迟进画面轨
ffmpeg -i out/FullPV_chip.mp4 -i "world.execute (me) ;.mp3" \
  -filter_complex "[1:a]adelay=233|233[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac out/FullPV_official.mp4
```

若你使用的 MIDI 转录与我们的不同，实测的 lag 可能不同——以第 1 步的输出为准（脚本会分段抽查速度漂移）。

## 仓库结构

```
├── src/
│   ├── Root.tsx / FullPV.tsx      # Remotion 入口；场景调度 + 官能线"升温"调色曲线
│   ├── CharStage.tsx              # 字符栅格舞台：离屏画布合成 + CRT 玻璃层 + 关机坍缩
│   ├── engine/
│   │   ├── song.ts                # song.json 消费端：KICKS/SNARES/脉冲/波形合成
│   │   ├── grid.ts                # 字符帧缓冲（Palette 调色板定义在此）
│   │   ├── deco.ts                # 甜甜圈/心/取景框/注释块歌词/伪码雨/故障
│   │   └── rng.ts                 # 确定性哈希（逐帧逐位可复现）
│   ├── scenes/S00…S10             # 27 个分镜单元（intro→outro），一场景一文件
│   └── timeline.ts                # 段落/歌词锚点（fan-LRC 对齐，单一事实来源）
├── scripts/                       # 音频管线 + 审计工具（见下）
├── tools/prepare_assets.py        # MIDI → song.json + chiptune.mp3
├── docs/
│   ├── STORYBOARD-REFERENCE.md    # 权威分镜基准（27 单元 + 叙事宪法）
│   ├── STYLE-CONTRACT.md          # 场景实现硬规则（完整契约）
│   ├── STORYBOARD-DELTA.md        # 分镜变更单模板
│   ├── TIMELINE.md                # 人读时间轴镜像（真值：src/timeline.ts）
│   ├── ai-review-protocol.md      # 复核纪律（判别式问法等）
│   ├── PILOT-REPORT.md            # 试点教训库（坑→条款对照表）
│   ├── ascii-root-cause.md        # 案例研究：线稿源为何必败
│   ├── ART-NOTES.md               # 成片字符画的真实来源（三层体系，先读这个再动手做素材）
│   ├── SCRIPTS.md                 # 每个脚本的功能介绍与实测可用的命令
│   ├── adr/                       # 15 份架构决策记录（ADR）
│   ├── storyboard.md              # 早期逐句分镜草案（已被 REFERENCE 取代，留作设计史）
│   ├── DESIGN.md                  # 立项设计共识（历史记录）
│   ├── reference-analysis.md      # 参考作品研究：官方 MV + 同人歌词 PV
│   └── workflow/                  # 多智能体协作工作流模板
└── public/                        # 运行时资产（由自备 MIDI 生成，不入库）
```

## 开发与审计工具

```bash
npm run audit:grid        # 字符网格不变量审计（scripts/audit_grid.ts）
python scripts/audit_frame.py bands out/still.png      # 帧审计：bands / bbox / preview / board
python scripts/qc/ab_board.py                          # 验收物料生成器（每轮替换清单）
python scripts/align_official_audio.py official.mp3 public/chiptune.mp3   # 音频偏移实测
```

场景代码约定（详见 `docs/workflow/PARALLEL-SCENE-PIPELINE.md`）：
**零绝对秒**（一律相对 `timeline.ts` 锚点）、**零随机数**（确定性哈希保证逐帧可复现）、
**红事件预算制**（大面积红全片唯二）。

## 制作过程

本项目由一名人类导演与 AI 代理集群协作完成：历经 11 轮评审迭代，每轮产出分镜
变更单、一次独立的像素级验证与一份签收的送审包。`docs/workflow/` 收录了给
设计代理与编排代理的提示词文档和并发分镜流水线契约——如果你想复刻这套
"人机协作做动画"的流程，可以从那里开始。

## 参考作品

- 官方 MV——Mili「world.execute(me);」：
  <https://www.youtube.com/watch?v=ESx_hy1n7HA>
- Eodslv（땡닢）的同人歌词特效 PV（本项目视觉语言的主要参考之一）：
  <https://www.youtube.com/watch?v=cn4M-fH08XY>

## 致谢

- **Mili** ——《world.execute(me);》，收录于专辑《Miracle Milk》（2016）。作词：Cassie Wei（momocashew）；作曲：Yamato Kasai。一切权利归 Mili / Saihate Records 所有。
- **Eodslv（땡닢）** ——上文所引 2017 年同人歌词视频，本项目视觉语言的来源之一。
- 社区考据：Mili Wiki、Genius、GodDrinksJava 转录项目（617 彩蛋的出处）。

## 授权

代码以 [MIT 协议](LICENSE)开源。**注意**：Mili 的音乐、歌词及商标**不在**本协议覆盖范围内。使用本项目产出视频并公开发布时，请遵守所在平台关于衍生/同人内容的规则，并注明原曲出处。
