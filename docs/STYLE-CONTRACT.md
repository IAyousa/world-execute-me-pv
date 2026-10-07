# 场景实现风格契约（子代理必读）

> 2026-10-05 立。任何代理/人实现或修改 `src/scenes/Sxx*.ts` 时，本文件
> 是硬规则。叙事宪法见 `STORYBOARD-REFERENCE.md` 的"贯穿系统"六条，
> 复核纪律见 `ai-review-protocol.md`——本契约是它们的技术执行层。
> **违反任何一条 = 集成门禁直接打回。**

## 0. 画面基底（事实，勿重算）

- 画布 1920×1080 @30fps，全片 211.8s（`src/Root.tsx`）
- 字符网格 **约 147 列 × 45 行**，cell ≈13×24px（`src/CharStage.tsx`
  启动时实测 Consolas 'M' 宽；勿在场景里硬编码尺寸）
- 两层绘制，层外不许画：
  - **Grid 层**：格坐标逐字符（`Grid.put / puts / center`），文本与网格 art
  - **overlay 层**：高清 canvas，ctx 像素坐标（`Scene.overlay`），大 art 专用
    （先例：皇后，`S00Intro.ts overlay()`）
- `t` = 全曲秒，`f` = 当前帧号；场景只在自身段落时间窗内输出，
  **越窗必须空操作**（别的场景会在同帧画自己的内容）

## 1. 接口与文件边界律

```ts
// src/scenes/shared.ts（只读）
interface Scene {
  draw: (g: Grid, t: number, f: number) => void;
  overlay?: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, f: number) => void;
  collapse?: (t: number) => { sy: number; lineGlow: number; lineW: number };
}
```

- **只写自己认领的 `Sxx*.ts`；`src/` 其余一切文件只读**（含但不限于
  `shared.ts`、`engine/grid.ts`、`engine/deco.ts`、`engine/song.ts`、
  `engine/rng.ts`、`timeline.ts`、`FullPV.tsx`、`CharStage.tsx`、
  其他 `Sxx*.ts`）。〔试点教训：场景普遍 import engine 全家，
  枚举式清单必有漏网，改兜底式——默认全只读，认领文件是唯一例外〕
- 需要新公共 helper：写进交付说明，由集成者统一加 `shared.ts`，
  不得本地复制改名（会造成方言分叉）
- 现成 helper 优先：`typeLine / bitmap / convergeBitmap / meBlock /
  youMark / ease / warmPal / hash`

## 2. 颜色律（ci 0–5，`engine/grid.ts PHOSPHOR`）

| ci | 色 | 语义 |
|---|---|---|
| 0 | bg | 背景底层 |
| 1 | dim | 沉底氛围纹理、装饰伪码、最旧句 |
| 2 | mid | 常规文本、已唱完的句 |
| 3 | main | 当前焦点、正在唱的句 |
| 4 | bright | 瞬时强调（≤0.5s）或状态达成定格 |
| 5 | accent 红 | 关键剧情瞬间，全片个位数次 |

- 升温曲线（磷光绿→琥珀：P1 起、P2 峰值、C2 缓冷）由调色板统一管，
  **场景不得私调 RGB 或发明新颜色**
- **特批例外·蓝（round 6 契约修订，导演 2026-10-05 批准，随
  STORYBOARD-DELTA-round6 单元 D 生效）**：C2-L6 蓝屏一闪专用
  `#0078d7`（BSOD 族蓝，overlay 层 fillRect）——全片**仅此一色、
  仅此一闪**（芯片域 ≈124.9–125.3，0.4s/12 帧）、**仅此一单元**；
  蓝不得在本窗之外任何时刻再现。本例外不松动上一条禁令
- **特批例外·白（round 8 契约修订 #2，导演 2026-10-05 批准随
  STORYBOARD-DELTA-round8 单元 B 生效；r8b 反馈轮扩为两用，导演
  2026-10-07 裁定）**：①末声处刑印专用白 `#ffffff`（overlay 层白字
  大写 `EXECUTION` 压红场，判决书上墨）——仅此一窗（芯片域
  161.58–162.63），印章语义：不闪烁、不位移、无描边特效；②墙段
  world 档雪花噪点方块（r8b：裂纹退役改白噪点，随机闪现每帧重掷、
  数量固定、只落背景不上文字，芯片域 153.60–158.90）。两用之外白
  不得在任何时刻再现。本例外不松动上两条禁令
- **特批例外·血（round 9 r9b 契约修订 #3，导演 2026-10-07 定色
  `#c00000`；round 10 单元 G 扩两用，导演 2026-10-07 拍板）**：两用
  ——①C3-L1 词戳血红闪（overlay 层居中大写 `EXECUTION`，处刑印同
  尺度回声、硬进硬出 0.24s，芯片域 165.16–165.40）；②末声红印场
  （S07Bridge 末声分支全屏 fillRect 场色，芯片域 161.58–162.63，
  白字形制不变）——EXECUTION 两次红同色对（词与场）。与系统红
  `PHOSPHOR.accent #ff5f56` 并存且分工：系统红=系统文字事件（心碎
  报告/墙段闪回/红栈），血红=处刑判决（印场）与其回声（词戳）；
  r9b 起 C3-L1 的 glitchPass 杂红同步收口（ci5→ci3）。两用之外
  血不得在任何时刻再现，本例外不松动以上禁令

## 3. 时间律

- 一切时刻读 `src/timeline.ts`（`SECTIONS / T / WINDOWS`），
  **禁止自造绝对秒数**——时间轴改一次，全片自动跟随
- 歌词必须走 `typeLine(g, x, y, text, t, t0, cps, te)`，`te` 传
  `WINDOWS` 对应窗的结束时刻；句龄色阶 3→2→1 由它管，不许手写
- 段落切换=小节线硬切；句间=变暗溶解；情绪超限=glitch（叙事宪法⑥）
- 存量欠账登记：`S10Outro.ts` 的 `T4=200.0` / `T0=191.77` 硬编码
  （值与 timeline 对应）是历史遗留，修复待导演另立变更单；
  **新代码一律禁止新增绝对秒数**，段内相对偏移也应锚定 T/SECTIONS。
  （round 6 销账记录：`S06Chorus2.ts` 堆栈门 `if (t > 97.5)` 死条件
  硬编码——同族新实例，发现即随 round 6 单元 E 删除，债清）

## 4. 字符画律（皇后专案血泪，全案见 `ascii-root-cause.md`）

1. art **必须脚本生成**：`scripts/ascii_site_style.py` 管线
   （实心剪影源 → 灰度 → LANCZOS → 亮度坡道 `@%#*+=-:. `），
   **禁止手敲 art、禁止线稿/镂空源**
2. 字体取形必须过 .notdef 防呆（`glyph_image` 自带；哪个字体真有
   该码点用 `--census` 查——Palatino 的 ♛ 是螺旋 .notdef，前车之鉴）
3. overlay 高清 art 必须**整行 fillText 文本流**；采样 cell 比 =
   渲染 advance:lineHeight（Consolas = 0.55），否则图形被剪切变形
4. 纹路/细部 ≤1/3 行高并对齐行中心（行高纹路经 LANCZOS 出血到
   相邻行，读作断口）
5. 尺寸反馈走渲染字号（线性 <20% 不可感知），不走砍行数
6. 参数化矢量源是首选（范例：`install_intro_icons.py::draw_queen_piece`，
   冠宽/腰身/底座/纹路全是旋钮）

## 5. 密度与留白律

- 单屏同时焦点 ≤2 个；主 art 与歌词/文本净空 **≥50px**
  （`audit_frame.py bands` 实测，不是目测）
- 交付附 bands 输出：相邻元素 gap 不得为 0（无贴死），主间隙不得
  >1/3 画幅高（无空洞）
- **设计性空镜豁免**：变更单 keep/notes 明示的有意空镜（如"万物
  退散只剩命令行"、黑场收束）主间隙可超 1/3 画幅高——编排者按
  变更单声明放行并记入轮次报告；未声明的照常打回
  〔试点教训：CHORUS1 幕3 空镜 703px 字面违例实为 v17 定稿构图〕

## 6. 验证律（交付前全过，缺一打回）

```bash
node_modules/.bin/tsc --noEmit                         # 零错误
python scripts/audit_frame.py preview --fs 9 -o out/tmp_preview.png   # 改了 art 时
node_modules/.bin/remotion still src/index.ts FullPV out/tmp.png --frame=N   # 段首/中/尾 ≥3 帧
python scripts/audit_frame.py bands out/tmp.png --x0 700 --x1 1220    # 间距实测
npm run audit:grid -- <t,...> "<字符集>"               # 网格断言（esbuild+node，秒级）
```

- **禁用 npx 调本机未安装的包**（round 5 实测：registry 拉取挂死，
  两个子代理独立发现）——tsc / remotion / esbuild 一律走
  `node_modules/.bin/` 本地 bin，网格断言走 `npm run audit:grid`

- 视觉自查用**判别式问法**（protocol §1）："这是 X 还是 Y？依据？"
  不用描述式开放题
- **数字优先于看图**（模型事实，2026-10 官方规格）：GLM-5.3 是
  文本/推理旗舰、**非原生多模态**——5.3 会话里的"看图"经服务端
  工具中转，判读质量不受会话控制（实证：箭头方向误读发生在
  5.3 会话期）。bands/bbox/audit_grid 的量化输出是主证据，
  看图只作辅助线索
- **验收物料标配**（试点终验导演认可）：A/B 并排板 + 差异地图
  （红删/绿增/黄变色）+ 逐行数字——`scripts/qc/ab_board.py` /
  `diff_map.py` 一条命令生成（输入 `out/qc/<轮>/_archive/`，输出
  验收包目录）；送审目录只放验收物料，过程帧一律归档 `_archive/`
- 自查清单：无 dropped 字符、无越窗输出、无静默兜底、
  字符全在 Consolas 字形集内

## 7. 禁止事项

- 改 §1 只读清单；引入新 npm 依赖；引入项目字体栈外字体
- 位图/照片材质（一切皆字符，叙事宪法②）
- 静默兜底：无数据→不画，不是画个默认值（蚊香案的教训泛化）
