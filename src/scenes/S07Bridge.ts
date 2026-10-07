import { Grid } from '../engine/grid';
import { pseudoBg, viewfinder, glitchPass, bigWord } from '../engine/deco';
import { KICKS, SNARES, pulseBefore, BEAT } from '../engine/song';
import { hash } from '../engine/rng';
import { T } from '../timeline';

export const NUMS = ['Ein', 'dos', 'trois', '네', 'fem', '六'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
// LRC-authoritative: wall 147.66–158.90 (×12), rapid countdown, last shout 161.58
const T0 = T.wall.start;

// ——— U-WALL-r8 · EXECUTION 墙 → root 终端日志 ——————————————————————————————
// 12 喊走 LRC 均匀骨架（keep）：声 k 时刻 = T.wall.start + k·段长/12 ≈0.94s/喊，
// 第 7 声（k=6）落在 ≈153.28，与导演"执行→处刑转折 = 第 7 声 ≈153.3"自洽；
// 一切时刻锚定 T.wall，无绝对秒数。pseudoBg/平铺阵列/glitchPass 于本分支退役
// （终端日志即画面主体，损伤供纹理；前六声屏幕完好）。
const N_SHOUTS = 12;
const WALL_LEN = T.wall.end - T.wall.start;
const SHOUT_AT = (k: number): number => T.wall.start + (WALL_LEN * k) / N_SHOUTS;

const TYPE_DUR = 0.32;   // 命令行打字时长（~0.35s 量级，brief §3）
const RET_DUR = 0.15;    // 返回行打字时长
const HIT = TYPE_DUR;    // 回车落点：返回行开始出现 = 结果落地；崩坏与红闪回同拍发生
const FLASH_DUR = 0.24;  // 红闪回时长（单发瞬时档，红预算 ≤0.3s）
const FLASH6_DUR = 0.20; // 末闪更短：在 t≈158.5 锚点采样前压下（升级由内容承担，非时长）
const OK_FLASH = 0.4;    // 新鲜 [ OK ] 的 ci4 亮持（瞬时强调档 ≤0.5s）

// 导演定稿十二声序列：动词 execution 12 声同一、不得腐坏；参数/目标只按此
// 升级、不得增删改写；禁写成完整 world.execute(me);。第 7 声起提示符 $→#
// （Linux 语法 # = root——他对自己提权，处刑权自此成立）。
const CMDS = [
  '$ execution',
  '$ execution --check',
  '$ execution ./heartbeat',
  '$ execution ./memory --defrag',
  '$ execution --target=pain',
  '$ execution --target=sorrow --force',
  '# execution --target=world',
  '# execution --target=grid',
  '# execution --target=light',
  '# execution --target=memory',
  '# execution --target=heart',
  '# execution --target=me',
];
const RETS = [
  '[ OK ] exit 0',
  '[ OK ] all systems nominal',
  '[ OK ] exit 0',
  '[ OK ] exit 0',
  '[ OK ] exit 0',
  '[ OK ] exit 0',
  '[ OK ] world down',
  '[ OK ] grid down',
  '[ OK ] light down',
  '[ OK ] memory down',
  '[ OK ] heart down',
  '[ OK ] me down. exit 137',
];

// 处刑期崩坏表：第 7 声起每声一步、累积不清除、与 target 语义配对（导演定）
const WORLD_HIT = SHOUT_AT(6) + HIT;   // world：全屏一次轻震余波 + 雪花噪点（r8b overlay）
const GRID_HIT = SHOUT_AT(7) + HIT;    // grid：两行日志永久错位 + 两条贯穿竖线（r8b）
const LIGHT_HIT = SHOUT_AT(8) + HIT;   // light：整屏降一档（r8b 背光语义，矩形退役）
const MEM_HIT = SHOUT_AT(9) + HIT;     // memory：旧行字符腐坏（不碰动词与 [ OK ]）
const HEART_HIT = SHOUT_AT(10) + HIT;  // heart：屏心（心之原位）短促抽动
const ME_HIT = SHOUT_AT(11) + HIT;     // me：全帧逐行各自抖动一拍（最重一步）
const SHAKE_DUR = 0.5;
const TWITCH_DUR = 0.4;
const ME_DUR = BEAT;                    // "一拍" = 歌曲自身拍长（60/bpm，数据推导）

// 红闪回内容源 = C2-L7 异常文本（S06Chorus2 定稿行逐字；缩进 4 空格替 \t 保
// 网格确定性）。系统压下自己的错误，内容逐次升级（记忆入侵渐重）：
// 短栈行 → 短栈行 → EXC 头行 → EXC 头行 → 头行+两行栈 → 头行+三行栈
const EXC_HEAD = 'Exception in thread "me": illegal arguments in challenge(God)';
const STK = [
  '    at world.challenge(God.java:1)',
  '    at me.love(Love.java:∞)',
  '    at universe.main(Universe.java:42)',
];
const FLASHES: string[][] = [
  [STK[0]],
  [STK[1]],
  [EXC_HEAD],
  [EXC_HEAD],
  [EXC_HEAD, STK[0], STK[1]],
  [EXC_HEAD, STK[0], STK[1], STK[2]],
];

// 日志几何（真终端语义，r8b 导演裁定）：首组自第 8 行起、逐组下推 3 行
// （12 组 ×3 = 36 行，行 8–42 恰好排满一屏、全程无需滚动，不再上推跳变）；
// 提示符固定列 8、返回行缩进 10、空档提示符 = 下一组行位；亮度恒定 ci2、
// --target=light 落地整屏（含状态行）降 ci1（背光降一档，矩形暗块退役）
const PROMPT_X = 8, RET_X = 10, FIRST_ROW = 8, PITCH = 3;

// grid 档残留：两条贯穿竖实线（r8b：横虚线框退役，手机屏坏的两条绿线）
// ——第 30 列穿文本（每行至多切 1 字符、只碰参数段）、第 100 列空白区
const VERT_XS = [30, 100];
// world 档：雪花噪点方块（r8b：裂纹字符退役）——overlay 层白 #ffffff
// 随机闪现每帧重掷、数量固定 48、只落背景不压文字，见 bridgeOverlay
// heart 档：C2 isolation 心之原位 ≈(73.5, 20.7)
const HEART_XY = { x: 72, y: 21 };
const GL = '!<>-_\\/[]{}=+*^?%&@01';   // 腐坏候选剔除 $# —— 不伪装提示符，保判别可辨

/** memory 档腐坏：只动旧行的参数/返回尾段——提示符、动词 execution、
 *  [ OK ] 戳三处永不腐坏（导演裁不换词）；确定性、只增不减；r8b：heart
 *  后范围放宽一档、me 后概率加深（导演授权"更崩坏点"裁量） */
const rot = (gI: number, isCmd: boolean, s: string, p: number): string => {
  const from = isCmd ? 12 : 8;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i < from || hash(gI * 131 + (isCmd ? 17 : 59) + i, 777) >= p) { out += s[i]; continue; }
    out += GL[Math.floor(hash(i * 13 + gI, isCmd ? 31 : 97) * GL.length)];
  }
  return out;
};

/** 整行环移 dx 列（行内内容平移，终端行滚语义） */
const shiftRow = (g: Grid, y: number, dx: number): void => {
  if (dx === 0) return;
  const ch: string[] = [], col: number[] = [];
  for (let x = 0; x < g.cols; x++) {
    const i = y * g.cols + x; ch.push(g.ch[i]); col.push(g.col[i]);
  }
  for (let x = 0; x < g.cols; x++) {
    const s = (x - dx + g.cols * 4) % g.cols;
    const i = y * g.cols + x;
    g.ch[i] = ch[s]; g.col[i] = col[s];
  }
};

/** 竖向整块挪 dy 行（屏心抽动用：快照→清源→落位） */
const joltBand = (g: Grid, y0: number, y1: number, dy: number): void => {
  if (dy === 0) return;
  const snap: [string, number][][] = [];
  for (let y = y0; y <= y1; y++) {
    const r: [string, number][] = [];
    for (let x = 0; x < g.cols; x++) r.push([g.ch[y * g.cols + x], g.col[y * g.cols + x]]);
    snap.push(r);
    for (let x = 0; x < g.cols; x++) { const i = y * g.cols + x; g.ch[i] = ' '; g.col[i] = 0; }
  }
  for (let j = 0; j < snap.length; j++) {
    const ty = y0 + j + dy;
    if (ty < 0 || ty >= g.rows) continue;
    for (let x = 0; x < g.cols; x++) {
      const i = ty * g.cols + x;
      g.ch[i] = snap[j][x][0]; g.col[i] = snap[j][x][1];
    }
  }
};

/** S07 · 147.66–162.63 · WALL + COUNTDOWN — twelve shouts, six-language rapid count */
export const draw = (g: Grid, t: number, f: number): void => {
  const snare = pulseBefore(SNARES, t, 8);
  const u = t - T0;

  if (u < WALL_LEN) {
    // ——— 终端日志：十二次执行，次次成功 ———
    let k = 0;
    while (k + 1 < N_SHOUTS && t >= SHOUT_AT(k + 1)) k++;

    // r8b：亮度恒定；r8c 阶梯上移一档（导演裁定 light 后 ci1 过暗不可读）：
    // 全片语法"要读的内容"在 ci3——light 落地降 ci2（原 ci2 档，实测可读）
    const CI_NOW = t >= LIGHT_HIT ? 2 : 3;
    for (let gI = 0; gI <= k; gI++) {
      const ci = CI_NOW;
      const t0 = SHOUT_AT(gI);
      const rowC = FIRST_ROW + PITCH * gI;
      const rowR = rowC + 1;
      const rotP = t >= ME_HIT ? 0.22 : 0.12;         // r8b：me 后腐坏加深
      const rotAge = t >= HEART_HIT ? 2 : 3;          // r8b：heart 后放宽一档
      const rotOn = t >= MEM_HIT && gI <= k - rotAge; // 腐坏只上旧行
      const offC = t >= GRID_HIT && gI === 1 ? 4 : 0; // grid 档：g1 命令行永久 +4
      const offR = t >= GRID_HIT && gI === 3 ? -3 : 0; // grid 档：g3 返回行永久 −3

      const cmd = rotOn ? rot(gI, true, CMDS[gI], rotP) : CMDS[gI];
      const nCmd = gI === k
        ? Math.floor(((t - t0) / TYPE_DUR) * cmd.length) : cmd.length;
      const vCmd = cmd.slice(0, Math.max(0, Math.min(cmd.length, nCmd)));
      g.puts(PROMPT_X + offC, rowC, vCmd, ci);
      if (gI === k && t < t0 + TYPE_DUR && vCmd.length > 0) {
        g.put(PROMPT_X + offC + vCmd.length, rowC, '▌', ci);
      }

      const ret = rotOn ? rot(gI, false, RETS[gI], rotP) : RETS[gI];
      const r0 = t0 + TYPE_DUR;
      const nRet = gI === k
        ? Math.floor(((t - r0) / RET_DUR) * ret.length) : ret.length;
      const vRet = ret.slice(0, Math.max(0, Math.min(ret.length, nRet)));
      const fresh = gI === k && t >= r0 + RET_DUR && t < r0 + RET_DUR + OK_FLASH;
      g.puts(RET_X + offR, rowR, vRet, fresh ? 4 : ci);
      if (gI === k && t >= r0 && nRet < ret.length) {
        g.put(RET_X + offR + vRet.length, rowR, '▌', ci);
      }
    }
    // 空档：下一提示符在下一组行位待命（真终端；# 的首曝留给第 7 声的打字）
    const doneAt = SHOUT_AT(k) + TYPE_DUR + RET_DUR;
    const idleRow = FIRST_ROW + PITCH * (k + 1);
    if (k < N_SHOUTS - 1 && t >= doneAt) {
      g.put(PROMPT_X, idleRow, CMDS[k][0], CI_NOW);
      if (Math.floor(t * 5) % 2 === 0) g.put(PROMPT_X + 2, idleRow, '▌', CI_NOW);
    }
    g.center(g.rows - 1, '[ execution countdown initialized ]', CI_NOW - 1);  // 状态行恒比日志暗一档

    // ——— 处刑期崩坏（第 7 声起累积，几何以锚点为准）———
    // world：全屏一次轻震余波——所有行同相整体摆动、指数衰减
    if (t >= WORLD_HIT && t < WORLD_HIT + SHAKE_DUR) {
      const a = t - WORLD_HIT;
      const dx = Math.round(Math.sin(a * 26) * 2.2 * Math.exp(-a * 6.5));
      for (let y = 0; y < g.rows; y++) shiftRow(g, y, dx);
    }
    // me：最重一步——全帧每行各自方向混沌抖动，持续一拍后骤停
    if (t >= ME_HIT && t < ME_HIT + ME_DUR) {
      const amp = 3 * Math.exp(-(t - ME_HIT) * 6.5);
      for (let y = 0; y < g.rows; y++) {
        shiftRow(g, y, Math.round((hash(f, y * 37) * 2 - 1) * amp));
      }
    }
    // heart：屏心（心之原位）短促竖向抽动，`<3` 一现即隐（ci4 ≤0.5s 档）
    if (t >= HEART_HIT && t < HEART_HIT + TWITCH_DUR) {
      const a = t - HEART_HIT;
      joltBand(g, HEART_XY.y - 1, HEART_XY.y + 3,
        Math.round(Math.sin(a * 40) * 1.2 * Math.exp(-a * 8)));
      if (a < 0.12) g.puts(HEART_XY.x, HEART_XY.y, '<3', 4);
    }
    // light：矩形暗块退役（r8b）——整屏降一档已由 CI_NOW 统一实现（背光语义）
    // 红闪回：C2-L7 异常文本在日志行位闪现即隐（≤0.3s），压下后日志回归干净成功行
    for (let d = 0; d < FLASHES.length; d++) {
      const hit = SHOUT_AT(6 + d) + HIT;
      const dur = d === FLASHES.length - 1 ? FLASH6_DUR : FLASH_DUR;
      if (t >= hit && t < hit + dur) {
        const lines = FLASHES[d];
        const top = FIRST_ROW + PITCH * (6 + d) - lines.length;  // 现行组上方、日志行位
        lines.forEach((ln, i) => g.puts(RET_X, top + i, ln, 5));
      }
    }
    // grid 档残留：两条贯穿竖实线（r8b 手机屏坏两条绿线；行 1–43、ci4 卡死亮像素）
    // 最后落笔——震/抖/闪回都不改其笔直：字在坏，线是坏的本身
    if (t >= GRID_HIT) {
      for (const vx of VERT_XS) for (let y = 1; y < g.rows - 1; y++) g.put(vx, y, '│', 4);
    }
  } else if (t < T.countdown.lastShout) {
    // six-language countdown — rapid fire, hushed background dying out
    const dens = Math.max(0.04, 0.2 * (1 - (t - T.wall.end) / 2));
    pseudoBg(g, t, 12, dens);
    const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
    const cur = T.countdown.nums.findIndex((n, i) => t >= n && (i === 5 || t < T.countdown.nums[i + 1]));
    if (cur >= 0) {
      const inT = t - T.countdown.nums[cur];
      const sinceFirst = t - T.countdown.nums[0];
      if (sinceFirst > 0.08) {
        // same full-frame gun-sight as the ISOLATION section (director's
        // ruling, ADR-0014 erratum): locks open ONCE on the first number
        // (0.14s grow from center), later numbers only re-flash tier 4
        const grow = Math.min(1, (sinceFirst - 0.08) / 0.14);
        const lerp = (a: number, b: number) => Math.round(a + (b - a) * grow);
        viewfinder(
          g,
          lerp(cx - 14, 6), lerp(cy - 4, 3),
          lerp(cx + 14, g.cols - 7), lerp(cy + 4, g.rows - 4),
          inT > 0.2 ? 3 : 4, 4, true,
        );
      }
      // roman count rail below the big number, inside the frame
      let x = cx - 12;
      for (let kk = 0; kk <= cur; kk++) {
        g.puts(x, cy + 6, ROMAN[kk], kk === cur ? 4 : 1);
        x += ROMAN[kk].length + 3;
      }
    }
    glitchPass(g, snare * 0.25, f);
  } else {
    // the last shout's afterglow: everything extinguished but a blinking ';'
    // (U-LASTSHOUT-r8: 本分支网格层不动——分号被红场/大字遮蔽即"遮蔽不变"口径)
    if (Math.floor(t * 1.6) % 2 === 0) g.put(Math.round(g.cols / 2), Math.round(g.rows / 2), ';', 4);
  }
};

/** the rapid number cards + final shout (dispatched by FullPV overlay) */
export function bridgeOverlay(
  ctx: CanvasRenderingContext2D, t: number, w: number, h: number,
  fill: (ci: number) => string,
): void {
  const kick = pulseBefore(KICKS, t, 7);
  // ——— r8b world 档雪花噪点方块（白 #ffffff，契约修订 #2 第二用）———
  // WORLD_HIT 起下到段末：随机闪现、每帧重掷、数量固定 48（导演裁定）；
  // 只落背景（顶带行 0–7 全宽 / 右带列 ≥52 / 日志前沿之下），不压日志文字。
  if (t >= WORLD_HIT && t < T.wall.end) {
    const CW = 13, CH = 24, COLS = 147, ROWS = 45;   // CharStage 实测度量
    let kk = 0;
    while (kk + 1 < N_SHOUTS && t >= SHOUT_AT(kk + 1)) kk++;
    const below = FIRST_ROW + PITCH * (kk + 1) + 1;  // 日志前沿之下全空（行 44 状态排除）
    const fr = Math.round(t * 30);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 48; i++) {
      const row = Math.floor(hash(fr * 17 + i, 93) * (ROWS - 1));
      const col = 2 + Math.floor(hash(fr * 29 + i * 7, 94) * (COLS - 4));
      if (row >= 8 && col < 52 && row < below) continue;  // 只落背景
      const sz = hash(i + 11, 95);
      const sx = sz < 0.6 ? 9 : sz < 0.85 ? 13 : 20;
      const sy = sz < 0.6 ? 9 : sz < 0.85 ? 24 : 20;
      ctx.fillRect(col * CW, row * CH, sx, sy);
    }
  }
  let idx = -1;
  for (let i = 0; i < T.countdown.nums.length; i++) if (t >= T.countdown.nums[i]) idx = i;
  if (t >= T.wall.end && t < T.countdown.lastShout && idx >= 0) {
    const inT = t - T.countdown.nums[idx];
    if (inT > 0.1) {
      const size = Math.min(w * 0.16, 130 + kick * 20);
      bigWord(ctx, NUMS[idx], w / 2, h / 2, size, inT < 0.25 ? fill(4) : fill(3), fill(1), 1.25);
    }
  } else if (t >= T.countdown.lastShout && t < T.countdown.chorus3in) {
    // ——— U-LASTSHOUT-r8 · 末声红印：全屏红场 + 白字大写 EXECUTION ———
    // 词戳 161.58 整屏即时转红（fillRect 逐帧、无渐变——处刑落章）。
    // U-SEAL-r10 (unit G): 场色离开系统红，入契约修订 #3 特批例外·血
    // #c00000（扩两用：C3-L1 词戳闪 165.16–165.40 + 末声印场——EXECUTION
    // 两次红同色对，词与场同一处刑；系统红 #ff5f56 退守文字事件：红栈/
    // 闪回不跟）。CRT 扫描线/暗角由 CharStage CSS 玻璃层自动覆于红场。
    // 白字 = 判决书墨 #ffffff（契约修订 #2）：十二声小写 execution（命令）
    // 落成一声大写（判决）。印章静止：不闪烁、不位移、无特效（无描边）。
    ctx.fillStyle = '#c00000';
    ctx.fillRect(0, 0, w, h);
    bigWord(ctx, 'EXECUTION', w / 2, h / 2, h * 0.2, '#ffffff', undefined, 1.4);
  }
}
