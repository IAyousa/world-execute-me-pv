/**
 * 全曲时间轴真值表 — 所有场景的段落/歌词时刻唯一来源。
 * 依据：song.json 音符级审计（docs/TIMELINE.md 表格带证据列）。
 * 调句：只改本文件；置信度：[实]=乐器乐句实测，[推]=小节网格推定，待导演耳校。
 */

export interface Section {
  id: string; label: string; start: number; end: number;
  evidence: '实' | '推';
  note?: string;
}

/** 段落表（人声 LRC 权威对齐：B站 opus/1008086574519287808 粉丝整理词表） */
export const SECTIONS: Section[] = [
  { id: 'intro', label: 'INTRO 人声×4', start: 0.0, end: 14.77, evidence: '实', note: 'LRC 0.10 起；颤音琴独铺' },
  { id: 'interlude1', label: '间奏①（吉他riff）', start: 14.77, end: 29.7, evidence: '实', note: 'LRC [00:16] 间奏标记' },
  { id: 'verse1', label: 'VERSE 1 几何求爱', start: 29.7, end: 44.45, evidence: '实', note: 'LRC 29.70 points' },
  { id: 'prec1', label: 'PRE-CHORUS 1', start: 44.45, end: 59.22, evidence: '实', note: 'LRC 44.45' },
  { id: 'chorus1', label: 'CHORUS 1', start: 59.22, end: 74.04, evidence: '实', note: 'LRC 59.22' },
  { id: 'verse2', label: 'VERSE 2 静物四连', start: 74.04, end: 88.58, evidence: '实', note: 'LRC 74.04–88.58（每句3.5s）' },
  { id: 'prec2', label: 'PRE-CHORUS 2 升温', start: 88.58, end: 103.48, evidence: '实', note: 'LRC 88.58–103.48' },
  { id: 'chorus2', label: 'CHORUS 2 你离开了', start: 103.48, end: 132.5, evidence: '实', note: 'LRC 103.48；arguments 止 ~132.5' },
  { id: 'climax', label: '间奏③ 器乐高潮', start: 132.5, end: 147.66, evidence: '实', note: '无歌词；鼓重音 132.92=高潮点' },
  { id: 'wall', label: 'EXECUTION 墙 ×12', start: 147.66, end: 158.9, evidence: '实', note: 'LRC 12 喊 147.66–158.90' },
  { id: 'countdown', label: '六语倒数+末声', start: 158.9, end: 162.63, evidence: '实', note: 'LRC 158.90–161.12 连珠炮+161.58' },
  { id: 'chorus3', label: 'CHORUS 3', start: 162.63, end: 177.24, evidence: '实', note: 'LRC 162.63' },
  { id: 'chorus4', label: 'CHORUS 4 学过的爱', start: 177.24, end: 191.77, evidence: '实', note: 'LRC 177.24–191.35' },
  { id: 'outro', label: '器乐尾奏', start: 191.77, end: 206.77, evidence: '实', note: '末声 Execution 205.85' },
];

/** 歌词句时刻（秒）——全部 [实]：粉丝 LRC 词表（B站 opus/1008086574519287808） */
export const T = {
  intro: [0.10, 3.87, 7.44, 11.09],
  verse1: [29.70, 33.41, 37.06, 40.70],
  prec1: [44.45, 47.67, 51.36, 55.08],
  chorus1: [59.22, 62.58, 66.60, 70.08],
  verse2: [74.04, 77.57, 81.35, 85.07],
  prec2: [88.58, 92.01, 95.46, 99.34],
  chorus2: {
    vibrations: 103.48,
    completion: 107.22,
    youFirst: 110.90, youStep: 0.95,           // ×5 → 115.65（LRC 110.90–114.92）
    isolation: 115.78,
    isolationSplit: 117.25,                  // 词级分割：'You have left me in' → 'ISOLATION'（无词级 LRC，按音节比例）
    fragments: 118.33,
    disheartened: 121.72,                       // 分镜漏句：Then maybe you won't…
    arguments: 125.70,                          // 三短句至 ~132.5
  },
  climax: { start: 132.5, drop: 132.92, end: 147.66 },
  wall: { start: 147.66, end: 158.9 },          // EXECUTION ×12 ≈0.94s/喊
  countdown: {
    nums: [158.90, 159.32, 159.65, 160.24, 160.69, 161.12],  // 连珠炮 0.3–0.6s/个
    lastShout: 161.58,                          // 最后一声 EXECUTION
    chorus3in: 162.63,
  },
  chorus3: {
    l34: 162.63, l35: 166.01, l36: 169.82, l37: 173.64,
    l34Exec: 165.16,   // LRC 词级戳（手册行 112 第三子句）：give them all the EXECUTION
    l35Exec: 168.91,   // LRC 词级戳（手册行 113 第三子句）：be your only EXECUTION
  },
  chorus4: [177.24, 180.85, 184.54, 188.48],
  // seqAt = S10 ending-sequence start (rel anchor; flash lands 206.8) —
  // added round 10 unit E to clear the contract §3 absolute-second debt
  ending: { seqAt: 200.0, exitAt: 203.0, execution: 205.85, flash: 206.77 },
};

/** 逐句窗口 [起,止)：句尾=下一句起；段末句止=段落终点（LRC 权威） */
export const WINDOWS: Record<string, [number, number][]> = {
  intro: [[0.10, 3.87], [3.87, 7.44], [7.44, 11.09], [11.09, 14.77]],
  verse1: [[29.70, 33.41], [33.41, 37.06], [37.06, 40.70], [40.70, 44.45]],
  prec1: [[44.45, 47.67], [47.67, 51.36], [51.36, 55.08], [55.08, 59.22]],
  chorus1: [[59.22, 62.58], [62.58, 66.60], [66.60, 70.08], [70.08, 74.04]],
  verse2: [[74.04, 77.57], [77.57, 81.35], [81.35, 85.07], [85.07, 88.58]],
  prec2: [[88.58, 92.01], [92.01, 95.46], [95.46, 99.34], [99.34, 103.48]],
  chorus2: [[103.48, 107.22], [107.22, 110.90], [110.90, 115.78], [115.78, 118.33], [118.33, 121.72], [121.72, 125.70], [125.70, 132.5]],
  chorus3: [[162.63, 166.01], [166.01, 169.82], [169.82, 173.64], [173.64, 177.24]],
  chorus4: [[177.24, 180.85], [180.85, 184.54], [184.54, 188.48], [188.48, 191.77]],
};

/** 歌词文本（供核对与未来自动排版；来源：分镜 v2 / Genius 转录） */
export const LYRICS: Record<string, string[]> = {
  intro: [
    'Switch on the power line, remember to put on PROTECTION',
    "Lay down your pieces and let's begin OBJECT CREATION",
    'Fill in my data parameters, INITIALIZATION',
    "Set up our new world and let's begin the SIMULATION",
  ],
  verse1: [
    "If I'm a set of points, then I will give you my DIMENSION",
    "If I'm a circle, then I will give you my CIRCUMFERENCE",
    "If I'm a sine wave, then you can sit on all my TANGENTS",
    'If I approach infinity, then you can be my LIMITATIONS',
  ],
  prec1: [
    'Switch my current to AC to DC',
    'And then blind my vision, so dizzy so dizzy',
    'Oh we can travel to A.D to B.C',
    'And we can unite, so deeply so deeply',
  ],
  chorus1: [
    'If I can, if I can, give you all the STIMULATIONS',
    'Then I can, then I can be your only SATISFACTION',
    'If I can make you happy, I will run the EXECUTION',
    'Though we are trapped in this strange strange SIMULATION',
  ],
  verse2: [
    "If I'm an eggplant, then I will give you my NUTRIENTS",
    "If I'm a tomato, then I will give you ANTIOXIDANTS",
    "If I'm a tabby cat, then I will purr for your ENJOYMENT",
    "If I'm the only god, then you're the proof of my EXISTENCE",
  ],
  prec2: [
    'Switch my gender to F to M',
    'And then do whatever from AM to PM',
    'Oh switch my role to S to M',
    'So we can enter the trance the trance',
  ],
  chorus2: [
    'If I can, if I can, feel your VIBRATIONS',
    'Then I can, then I can finally be COMPLETION',
    'Though you have left, you have left… (×5)',
    'You have left me in isolation',
    'If I can, if I can, erase all the pointless FRAGMENTS',
    'Then maybe, then maybe you won\'t leave me so DISHEARTENED',
    'Challenging your god, you have made some ILLEGAL ARGUMENTS',
  ],
  chorus3: [
    'If I can, if I can give them all the EXECUTION',
    'Then I can, then I can be your only EXECUTION',
    'If I can have you back, I will run the EXECUTION',
    'Though we are trapped, we are trapped ah',
  ],
  chorus4: [
    "I've studied, I've studied how to properly LO-O-OVE",
    'Question me, question me, I can answer all LO-O-OVE',
    'I know the algebraic expression of LO-O-OVE',
    'Though you are free, I am trapped, trapped in LO-O-OVE',
  ],
  reprise: [
    'If I can, if I can, give you all the STIMULATIONS',
    'Then I can, then I can be your only SATISFACTION',
    'If I can make you happy, I will run the EXECUTION',
    'Though we are trapped in this strange strange SIMULATION',
  ],
};
