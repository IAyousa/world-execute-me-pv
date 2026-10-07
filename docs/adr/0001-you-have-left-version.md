# ADR-0001: "you have left"×5 采用 A 删除版，B 折入为背景残影

日期：2026-10-03 · 状态：已定稿（导演授权代理决策）

## 背景

分镜 v2 审阅点②要求样片做两版对比后定稿：
F2（A 删除版：巨大 YOU 逐字退格×5）与 F3（B 堆叠版：五行 you have left 竖排渐暗渐碎）。
导演选择全程不干预，授权执行方自行审看定稿。

## 决策

**A 删除版胜出**，理由（基于对两版成片同帧位审看）：

1. **可读性**：A 的巨大 `YOU` + 退格动作在 1080p 下一帧读懂；
   B 的五行堆叠在缩放后糊成碎屑，"you have left"文本本体几乎不可辨。
2. **情绪烈度**：分镜要求"一次比一次狠"——退格是动作，堆叠只是状态；
   动作的递进感更强。
3. **与前后文衔接**：A 的底部静物熄灭（猫→番茄→茄子）与 overlay 大字
   机制都已验证可用，直接进全曲工程。

**吸收 B 的长处**：第 4、5 次删除时，在巨大 YOU 背后叠入 B 版的
渐暗、渐碎、渐斜的 `you have left` 残影行，让"删除"有余响。

## 影响

全曲 CHORUS 2 场景以 F2 代码为基底移植，按分镜绝对时间重排；
去掉样片专用的 `[ fragment 02A … ]` 字幕条。

## 勘误（2026-10-04 导演十三审：左下角三静物删除）

导演终审 S06：YOU×5 段左下角的三个迷你静物（猫/番茄/茄子，
"逐 pass 熄灭"机制）**整组移除**——"没必要保留"。删除
S06Chorus2.ts 的 stills 绘制块及 CAT/TOMATO/EGGPLANT 常量与
bitmap 导入；B 版残影行、大字 YOU、glitch 原样保留。
验证：YOU×5 两帧（pass0/pass2 时刻）静物区（列5–32、行36–41）
墨迹 0px；残影带与大字 YOU 墨迹正常。v6 送审副本搭载。

## 勘误 2（2026-10-04 导演十四审：isolation 两拍 + Though 整句）

v10 修复 isolation 行起打时刻（`fragments−0.1` → `isolation`）后，
导演定稿两项设计（v11）：

- **isolation 两拍**：整行拆成 `'You have left me in'` 与
  `'ISOLATION'`，先后出现在**爱心下方同一位置**（row 32，居中），
  绝不同框。分割点入 timeline.ts（`isolationSplit: 117.25`，无词级
  LRC 按音节比例估）——词本身落地时才现身，大写即重音。
- **Though 整句**：YOU×5 段开头（youFirst）于标准歌词位 typeLine
  完整句 `Though you have left, you have left`（默认降档梯——pass
  3+ 时整句转中档，与删除烈度同步）；残影行继续只带
  `you have left`（='Though' 被删去），并新增第三阶段溶解：
  完好 → `·` → 消失（`fr < frag*0.5` 的字符直接不画）。删除主题
  三层嵌套：整句失 Though → 残影碎点 → 残影消散，与大字 YOU 退格
  同构。

验证：row3 整句 33 字符（112.5 亮 155 / 114.8 中档 86）；row32
两拍 278px(18 字符)→192px(9 字符) 先后同位；tsc 通过。v11 搭载。

## 勘误 3（v12：两拍居中 + 爱心与 ISOLATION 同拍）

导演复验 v11 两点：① 两拍文字不居中——根因是 `commentBlock`
渲染为 `/* 文本 */`（+6 字符），按裸字符串居中导致重心右偏
3 格（实测 +32.5px）。修复：按**渲染长度**居中并锚定**爱心
墨迹中心（col 74 ≈ 961px）**，残差收敛到 +6.5px（半格，格分辨率
极限）。② 出场次序改为：前半句**先单独出现**（爱心不出），
`isolationSplit` 时刻**爱心与 ISOLATION 同拍弹出**（爱心短暂
中档后 0.4s 转亮，保留原 ramp）。验证：116.5s 爱心缺失+短语
在位；117.6s 起心词同现。
教训：**居中计算必须按渲染后长度**（包装符/定界符计入），并以
参照物墨迹中心为锚，网格几何中心会累积半格级系统偏差。

## 勘误 4（v13：Though 段定稿——单句出现即消失，残影居中接管）

导演定稿设计：标准歌词位**只打 `'Though you have left'` 一句**
（不再重复后半句），出现后**消失**，此后仅靠大字 YOU 上方的
残影承载文本。实现三件套：

- 歌词位单句 `typeLine('Though you have left')`，于
  `youFirst + 2*youStep`（112.80s，即首行残影亮起的同一拍）**截断
  消失**——前句谢幕与残影登台无缝交接，整段生命周期内恒亮档；
- 残影行基点 `cx−12` → `cx−6`：12 字符 `you have left` 原本整体
  偏左 ~6 格（实测中心偏左 80+px），改为中心对齐大字 YOU
  （实测 968px vs 屏幕 960，+8px 半格内），保留每行 +1 的渐斜；
- 残影三阶段溶解（完好→点→消散）与 'Though' 删除语义不变。

验证：111.5s 歌词位打字中、113.0s 歌词位空+残影在位、114.8s
残影三行居中。v13 搭载。

## 关联记录（v14：全片歌词大小写对齐分镜参考手册）

导演要求注释歌词与 docs/STORYBOARD-REFERENCE.md 的歌词大小写
**完全一致**。逐行对照后修正 8 个场景 30 行：关键词全大写
（PROTECTION / OBJECT CREATION / INITIALIZATION / SIMULATION /
DIMENSION / CIRCUMFERENCE / TANGENTS / LIMITATIONS / STIMULATIONS /
SATISFACTION / EXECUTION / NUTRIENTS / ANTIOXIDANTS / ENJOYMENT /
EXISTENCE / VIBRATIONS / COMPLETION / FRAGMENTS / DISHEARTENED /
ILLEGAL ARGUMENTS / LO-O-OVE×4），`God→god`（S06 L5，代码串
challenge(God) 不属歌词不改）。S02/S05 原本已符合（AC to DC、
A.D to B.C、F/M、AM/PM、S/M、the trance 小写）。timeline.ts 的
LYRICS 人读镜像同步。
**保留的非大小写差异**（LRC 转录与手册措辞差，未动，待导演指示）：
intro L4 "Setup"（手册作 "Set up"）；S09 四行的重复短语
（"I've studied, I've studied" vs 手册单次）等。

## 关联记录 2（v15：对照 B 站 LRC 原文的精确核对）

导演指出手册歌词源即 B 站 opus/1008086574519287808 的粉丝 LRC，
拉取原文逐行核对后修正三处类别：**实词** `Setup`→`Set up`
（intro L4）；**大小写** 残影 `you have left`→`You have left`
（LRC 四次重复均大写 Y）；**子句中部逗号** 8 处（LRC 原文
相邻无分隔：data parameters / so dizzy so dizzy / Oh we can /
so deeply so deeply / strange strange / Oh switch / the trance
the trance / we are trapped ah）。确认 chorus4 重复短语
（I've studied, I've studied 等）LRC 原文即有，系手册缩写。
**保留约定**：LRC 换行子句以 ", " 连接为单行注释（连接逗号
非 LRC 文本），行首大写降为小写——若需逐字符一致可再去除。
