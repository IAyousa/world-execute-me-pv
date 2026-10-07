> **⚠ 已被取代（历史文档）**：本表是设计早期（round 2 前后）的逐句
> 分镜草案，保留了设计推演过程。**成片的权威分镜见
> [STORYBOARD-REFERENCE.md](STORYBOARD-REFERENCE.md)**（27 单元、
> LRC 对齐终稿），时间轴真值见 `src/timeline.ts` 与
> [TIMELINE.md](TIMELINE.md)。

# 《world.execute(me);》分镜表 v2 — 融入参考片分析

> v2 变更（依据 docs/reference-analysis.md 与导演拍板）：
> ① 歌词默认以 `/* */` 注释块形态打出，天然可代码化的句子用代码原生形态
> （diff/语句/公式）；② 副歌峰值启用**大字阶词卡**（等宽放大+拉宽字距+描边，
> 保持一切皆字符）；③ **取景框/瞄准框**进入母题库；④ 句间**交叉溶解**转场；
> ⑤ "you have left"×5 与 背景伪码/致意卡 → **样片两版对比后定稿**。

> 歌词驱动分镜：每句歌词 × 精确时间 × 图像事件。
> 时间戳来源：MIDI 吉他单音线（track 10，人声旋律镜像）、小提琴轨（track 9）、
> 颤音琴尾奏（track 2）。置信度标注：**[实]**=乐器乐句直接对齐，
> **[推]**=段落内均分推定，成片前须用官方音频终校。

## 总览

| 时间窗 | 段落 | 歌词段落 | 核心视觉 |
|---|---|---|---|
| 0:00.0–0:14.8 | INTRO | "Switch on the power line…" | 上电开机自检（歌词即启动日志） |
| 0:14.8–0:29.5 | VERSE 1 | 几何求爱四连 | **字生图**：点阵/圆/正弦波/极限 |
| 0:29.5–0:44.3 | PRE-CHORUS 1 | AC→DC…时空开合 | 整流、涡旋、年份倒卷+617彩蛋 |
| 0:44.3–0:58.6 | CHORUS 1 | "give you all the stimulations" | 全屏脉冲；execute 首次被打断 |
| 0:58.6–1:13.9 | VERSE 2 | 静物四连 | **图解**：茄子/番茄/虎斑猫/神像 |
| 1:13.9–1:21.7 | PRE-CHORUS 2 | F→M / S→M | **配置diff + 屏幕升温**（官能线） |
| 1:21.7–1:41.5 | CHORUS 2 | "you have left…" | YOU五次删除→隔离沙箱→心浮现 |
| 1:41.5–2:12.9 | BRIDGE | Execution×12 + 六语倒数 | 字符阵列→全屏大数字读秒 |
| 2:12.9–2:41.0 | CHORUS 3 | "have you back…" | 爆点：心与圈崩解；execute 完整敲下 |
| 2:41.0–2:57.7 | CHORUS 4 | "I've studied…" | love.md / 公式 / 对切镜像 |
| 2:57.7–3:26.8+ | OUTRO | （器乐）→ "Execution" | 世界逐层退场→闪屏→CRT关机 |

---

## 逐句分镜

### INTRO（0:00–0:14.8）— 歌词就是开机日志

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 1 | 0:00.0 [实] | Switch on the power line, remember to put on protection | 全黑上电：电压字符线 `────▄▀▄────` 从左向右点亮；`[PROTECTION: ON]` 徽标亮起 |
| 2 | 0:03.7 [推] | Lay down your pieces and let's begin object creation | 棋子式组件 `◍ ◍ ◎` 依次落位；`new Me()` 实例化出第一个小方块 **me** |
| 3 | 0:07.4 [推] | Fill in my data, parameters, initialization | 表单字段逐个自动填充：`name: me` `gender: F` `role: dom` … |
| 4 | 0:11.1 [推] | Setup our new world and let's begin the simulation | 网格平面展开为世界；**甜甜圈 materialize（节点①）**——世界的第一件造物 |

氛围：纯日志排版、近全黑、无图形装饰。前奏四句的全部信息量都在"开机"这个动作里。

### VERSE 1（0:14.8–0:29.5）— 几何求爱 · 字生图四连

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 5 | 0:15.2 [实] | If I'm a set of points, then I will give you my dimension | 歌词字符打散成**点阵**散落 → 坐标轴从点阵中生长展开（给出维度） |
| 6 | 0:18.9 [实] | If I'm a circle, then I will give you my circumference | 字符流汇聚描出一个**圆**（圆规式描线），周长弧段高亮流转 |
| 7 | 0:22.6 [实] | If I'm a sine wave, then you can sit on all my tangents | 字符铺出**正弦波**；每个波峰落下一条切线；**光标（=you）坐上切点** |
| 8 | 0:26.3 [实] | If I approach infinity, then you can be my limitations | 数轴 `1→10→100→…→∞` 加速飞出画面；一个方框（极限）把 me 圈在其中 |

氛围：坐标系网格背景。甜甜圈退到画面极远处小转（待机=世界的空转）。

### PRE-CHORUS 1（0:29.5–0:44.3）— 开关与时空

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 9 | 0:29.5 [推] | Switch my current to AC to DC | 字生图：交流**正弦波被整流**——`≈≈≈≈` 波浪字符逐段拉平成 `────` 直线 |
| 10 | 0:33.2 [推] | And then blind my vision, so dizzy, so dizzy | 字符**重影错位**+缓慢涡旋，画面轻微失焦 |
| 11 | 0:36.9 [推] | Oh, we can travel to A.D to B.C | 年份数字倒卷滚动 `2026→…→1→-1→…`；**彩蛋**：`world.timeTravelForTwo("AD", 617, me, you);` 低亮度一闪 |
| 12 | 0:40.6 [推] | And we can unite, so deeply, so deeply | 两股字符流**相互渗透缠绕**合为一体（官能线①：只做"融合"，点到为止） |

氛围：色温开始微暖（绿中透琥珀）。

### CHORUS 1（0:44.3–0:58.6）— 第一次满溢

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 13 | 0:44.3 [推] | If I can, if I can, give you all the stimulations | **全屏脉冲波**从中心 me 向边缘一圈圈扩散 |
| 14 | 0:47.9 [推] | Then I can, then I can be your only satisfaction | 万物退散，**光标放大居中**——你，是唯一 |
| 15 | 0:51.5 [推] | If I can make you happy, I will run the execution | `> world.execute(me);` 敲到一半**被打断**（全片伏笔：第一次未能执行） |
| 16 | 0:55.1 [推] | Though we are trapped in this strange, strange simulation | 网格扭曲抖动，顶部行像贴图错位般滑动 |

### VERSE 2（0:58.6–1:13.9）— 静物四连 · 图解式

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 17 | 0:59.5 [实] | If I'm an eggplant, then I will give you my nutrients | ASCII **茄子**落上"桌面"，营养成分数值向上飘出 |
| 18 | 1:03.2 [实] | If I'm a tomato, then I will give you antioxidants | ASCII **番茄**；`antioxidant++` 计数跳动 |
| 19 | 1:06.9 [实] | If I'm a tabby cat, then I will purr for your enjoyment | ASCII **虎斑猫**卧下，`~♪ ~♪` 呼噜波纹一圈圈漾开 |
| 20 | 1:10.6 [实] | If I'm the only god, then you're the proof of my existence | 高耸**神像**剪影立起；拉远——**神像全身由千万个微小的 `me` 字符组成**（备选案见文末审阅点①） |

氛围：静物台聚光效果（主体亮、四周密度骤降）。

### PRE-CHORUS 2（1:13.9–1:21.7）— 配置 diff · 官能线主战场

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 21 | 1:14.3 [实] | Switch my gender to F to M | diff 面板：`- me.gender = F` / `+ me.gender = M`；me 的字符体轮廓同步微变 |
| 22 | 1:16.2 [实] | And then do whatever from AM to PM | 字符时钟加速翻页 `00:00→23:59` |
| 23 | 1:18.0 [实] | Oh, switch my role to S to M | `- me.role = dom` / `+ me.role = sub`；**屏幕升温**：绿→琥珀脉动渐强 |
| 24 | 1:20.0 [实] | So we can enter the trance, the trance | 全屏字符随节拍**呼吸性缩放**，焦点涣散 |

氛围：本段专属——色温持续升温，是全片最"热"的 8 秒。

### CHORUS 2（1:21.7–1:41.5）— 崩点：你离开了（小提琴段）

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 25 | 1:21.7 [实] | If I can, if I can, feel your vibrations | 振动波形**逐渐衰减**变稀 |
| 26 | 1:25 [推] | Then I can, then I can finally be completion | 拼图图案缺最后一块——那块是 **you 的轮廓**，飞出画面 |
| 27 | 1:27–1:32 [推] | Though you have left…（×5） | 【样片A/B两版】**A 删除版**：屏幕上巨大的 `YOU` 被**逐字退格删除，共五次，一次比一次狠**；**B 堆叠版**：五行 `you have left` **竖排堆叠**，一行比一行暗、碎、斜。共同点：此前出现的静物（猫→番茄→茄子）依次熄灭 |
| 28 | 1:32 [推] | You have left me in isolation | 画面收缩进字符边框盒（**沙箱**）；甜甜圈回到中央、**字符心在圈中浮现（节点②）** |
| 29 | 1:34 [推] | If I can, if I can, erase all the pointless fragments | hex 内存列**成块崩落**清空 |
| 30 | 1:37–1:41.5 [实*] | Challenging your God, you have made some illegal arguments | **红色异常堆栈**抛出（全片第一次大面积用红）：`Exception in thread "me": illegal arguments in challenge(God)` |

氛围：全面稀疏化；小提琴=画面主导线条（弦乐长音做成长横线字符）。

### BRIDGE（1:41.5–2:12.9）— 处刑倒数

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 31 | 1:43.4 起 [实] | Execution ×12 | `EXECUTION` 以等宽字符阵列**铺满全屏**并随电子节拍跳动/位移（12 行对应 12 次齐喊） |
| 32 | ~1:55–2:11 [推] | Ein, dos, trois, 네, fem, 六 | 全屏**大字符逐个砸出，一秒一个**，每个数字用原语言字符渲染（德`Ein`/西`dos`/法`trois`/韩`네`/瑞典`fem`/汉`六`）；**取景框**：四角角标先于数字一拍出现、把数字锁进框中；背景逐层熄灭进入读秒静默 |
| 33 | 2:11–2:12.9 [推] | execution | 六之后全屏只余一个闪烁的 **`;`** ——悬停——爆点前最后一拍 |

### CHORUS 3（2:12.9–2:41.0）— 爆点

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 34 | 2:12.9 [实] | If I can, if I can give them all the execution | 倒数数字的**残影爆开成粒子风暴** |
| 35 | ~2:20 [推] | Then I can, then I can be your only execution | **大字阶词卡**：`YOUR ONLY EXECUTION` 等宽放大+拉宽字距+描边，四角取景框锁定（Eodslv式词卡，字符纯度不减）；同时**心与甜甜圈一起故障崩解（节点③）**——字符如碎玻璃散落 |
| 36 | ~2:27 [推] | If I can have you back, I will run the execution | 空荡的 `YOU` 轮廓闪现一瞬又熄灭；`> world.execute(me);` **这次完整敲下并回车** |
| 37 | ~2:34 [推] | Though we are trapped, we are trapped, ah | 网格 cage 从四罩下，me 困于其中 |

氛围：满密度、故障峰值（仍守红线：单帧闪、不连闪）。

### CHORUS 4（2:41.0–2:57.7）— 学过的爱

| # | 时间 | 歌词 | 画面 |
|---|---|---|---|
| 38 | 2:42.9 [实] | I've studied, I've studied how to properly love | `love.md` 文档翻页，条目逐条被划上重点 |
| 39 | 2:46.6 [实] | Question me, question me, I can answer all love | Q/A 问答式打字对答 |
| 40 | 2:50.3 [实] | I know the algebraic expression of love | 公式行展开：`love = Σ(you × me) / ∞` |
| 41 | 2:54.0 [实] | Though you are free, I am trapped, trapped in love | **对切画面**：左半=敞开的门、字符向外逃逸（你自由了）；右半=me 困在盒中央（我困在爱里）——研究报告中点名的镜像终局 |

### OUTRO（2:57.7–结尾）— 终幕关机

| # | 时间 | 内容 | 画面 |
|---|---|---|---|
| 42 | 2:57.7–3:25.8 [实] | （器乐） | 所有元素渐次退场：静物、网格、hex 列、心……最后只剩**甜甜圈孤转**——世界回到无意义的空转 |
| 43 | ~3:25.9 [实] | Execution（最后一次） | 全屏只剩 `Execution` 一词 → **闪屏一帧** → **CRT关机**：画面垂直坍缩成一条亮线→缩成一个亮点→熄灭 → `[process exited with code 0]` 暗显一瞬 → 黑场中光标最后闪一次 → 全黑 |

> 注：MIDI 在 3:26.8 戛然而止（原曲 3:33，尾部混响被转录裁掉）。关机动画+黑场
> 自然多占 2–4 秒，恰好补齐到原曲长度附近。

---

## 制作注记

- **待官方音频终校的边界**（不影响开工，成片对轨时校正）：
  PreC2/Chorus2 分界（±4s）、you-have-left 五连的各自时刻、Bridge 内
  Execution 阵列→倒数切换点（现推定 ~1:55）、最终 Execution 精确落点。
- MP4 与网页版分镜完全一致；差异仅：网页版开播前多一个
  `PRESS ENTER TO EXECUTE` 提示页。
- 频闪红线执行：全片所有闪烁均为单帧、间隔≥0.5s。
- **v2 新增制作条款**：句间交叉溶解（上一句注释块淡出与下一句淡入重叠，
  不留真空）；背景铺**小号装饰伪码流**（官方密度观：小到读不清，纯氛围）
  【样片验证】；结尾关机黑场后一行 `// thank you, Mili` 致意【样片验证】。

## 审阅点（v2 状态）

1. ~~神像句两案~~ → 按推荐案A（千万个 me 组成神像）进样片，效果不佳再换B。
2. ~~YOU 五连删烈度~~ → 样片做 A 删除版 / B 堆叠版两版对比定稿。
3. ~~六语倒数呈现~~ → 原语言大字+取景框方案进样片。
4. 分镜 v2 其余条款已随参考片分析定稿；样片阶段集中看效果。
