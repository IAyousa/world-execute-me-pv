# ADR-0006: 官方音频对齐 — 0.244s 恒定偏移与克隆首帧方案

日期：2026-10-03 · 状态：已定稿
触发：导演提供官方人声音频 `world.execute (me) ;.mp3`（212.35s，44.1k 立体声）。

## 证据链（onset 包络互相关，`scripts/align_official_audio.py`）

1. 全曲互相关：chiptune/MIDI 结构比官方音频**早 0.244s**（主峰 score 1.0）。
2. 分段抽查（每 40s）：0–200s 各段一致锁定 −0.244s → **恒定偏移，无速度漂移**
   （尾奏段 +0.209 为 8 分音符相位混淆，与主峰差恰 2 拍 0.46s）。
3. 排除"错锁相邻拍"：±1s 内局部峰族按 2 拍（0.462s）栅格排列，但 ±1 拍
   位置（−0.017/+0.482）得分仅 0.38/0.40 —— onset 在 8 分音符层不混淆奇偶拍。
4. 前 2s onset 逐点匹配：官方每个大 onset 与 chiptune+0.244 精确对应
   （5/5，误差 ≤17ms）；"silencedetect 首声 0.111s" 假设仅 1/5 匹配——
   那个 −35dB 边缘信号是前置噪声，不是音乐开始。

## 与 ADR-0005 的表面矛盾及解释

LRC（按官方音频听记）与 MIDI 几乎零偏移（头尾互证），但官方音频本身比
MIDI 晚 0.244s → **B 站参考视频的音画有 0.244s 延迟**（其画面晚于音轨），
听记者按画面记词，故 LRC≈MIDI 画面坐标。结论：LRC 时刻表对画面依然正确，
无需改时间轴；仅官方音频版需要补偿。

## 决策

- `FullPV.mp4`（chiptune 版）：不动，零偏移。
- `FullPV_official.mp4`：视频流 `tpad=start_duration=0.2333:start_mode=clone`
  （克隆首帧 7 帧）后混官方音轨。补偿后残差 +11ms（EBU R37 容差内）。
  否决"音频提前 0.244s"方案：会削掉官方首句起拍。
  帧粒度 33ms 下 7 帧为最优（8 帧残差 −23ms 劣于 7 帧 +11ms）。

```bash
ffmpeg -y -i out/FullPV_body.mp4 -i 'world.execute (me) ;.mp3' \
  -map 0:v -map 1:a -vf tpad=start_duration=0.2333:start_mode=clone \
  -c:v libx264 -crf 17 -preset medium -c:a aac -b:a 256k -shortest \
  out/FullPV_official.mp4
```

## 教训

- "音频对齐"不能只看首声静音检测：混音前置/编码延迟会骗过 silencedetect，
  onset 包络互相关 + 逐点匹配才是结构级判据。
- 恒定 lag 分段一致 = 无速度漂移；相位混淆只发生在强周期段落（尾奏）。
