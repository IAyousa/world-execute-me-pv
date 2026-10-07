import { Grid } from '../engine/grid';
import { typeLine, axes, ease, clamp01 } from './shared';
import { T, WINDOWS } from '../timeline';
import { BEAT } from '../engine/song';

const L = [
  "If I'm a set of points, then I will give you my DIMENSION",
  "If I'm a circle, then I will give you my CIRCUMFERENCE",
  "If I'm a sine wave, then you can sit on all my TANGENTS",
  'If I approach infinity, then you can be my LIMITATIONS',
];

/* ── 点列母题（round2 变更单；r2b 归轴轮）────────────────────────
   全链 N=40 点守恒。r2b 拍板：一切几何锚定坐标轴——
   原点 (cx,cy)=(74,23)、x 轴 = 行 23、y 轴 = 列 74：
   A 排点长在 x 轴上；B 圆心 = 原点；C 波以 x 轴为平衡位置；
   D 渐近线与 x 轴重合（点列自上方向轴贴近）。
   四站同一函数 ptsPos() 贯穿：形态只依赖 t（连续）⇒ 站分支切换帧
   前站尾态=后站 0 时刻形态，分支仅切换装饰层。 */
const N = 40;
const ASP = 13 / 24;          // cell 像素宽高比 → 让圆在像素上是圆
const RAMP = 0.12;            // 起波前沿过渡带宽（u 单位）

/* 存量前移常量（keep：视觉起点早于分支进入时刻，≈29.2/33.1/36.8/40.2） */
const LEAD0 = 29.2, LEAD1 = 33.1, LEAD2 = 36.8, LEAD3 = 40.2;
/* 词点（round2 变更单已声明：DIMENSION≈32.68 / TANGENTS≈40.04） */
const DIM_AT = T.verse1[0] + 2.98;
const TAN_AT = T.verse1[2] + 2.98;

const UPG_DUR = Math.min(0.8, Math.max(0.5, BEAT));   // 升维克隆 0.5–0.8s（bpm130→0.5s）
const UPG_T0 = DIM_AT - UPG_DUR / 2;                  // 峰值卡在词点；≤32.93 收回（33.0 锚）
const BEND_T0 = LEAD1, BEND_DUR = 1.2;                // 弯合 1.0–1.2s 取上限（34.0 未闭合锚余量）
/* C 站两段（r2b R3）：圆压平回轴上一排点 → 自左向右起波成正弦 */
const FLAT_T0 = LEAD2, FLAT_DUR = 0.6;                // ① 收拢/压平 0.5–0.8s
const WAVE_T0 = FLAT_T0 + FLAT_DUR, WAVE_DUR = 0.7;   // ② 起波传播（38.0 锚 ≥80% 屏宽反推）
/* D 站双动线（r2b R4；r2c R3 重构 x 律）：x 分段律 + 净空逐点减半贴近 x 轴 */
const ZENO_T0 = LEAD3, ZX_DUR = 1.8;   // 1.8s ⇒ q(42.0)=1：42.0 锚帧已是精确冻结位
const ZY_T0 = ZENO_T0 - 0.05, ZY_DUR = 0.6;   // y 动线先启并于 40.75 完成 ⇒ 40.7 分支
                                               // 切换时全列已在轴上方（净空门禁无闪烁弹出）
const RIDE_T0 = WAVE_T0 + WAVE_DUR + 0.05, RIDE_DUR = 2.0, GLIDE_DUR = 0.7;
const LINE_T0 = RIDE_T0 + RIDE_DUR + GLIDE_DUR, LINE_DUR = 0.75;  // 渐近线自光标落点向外铺
const DISS_T0 = WINDOWS.verse1[3][1] - 0.5;           // 变暗溶解，完成于本窗内
/* TANGENTS 敲定闪现 ×3：全部落在 y 动线显著变形（40.15+）之前，
   锚定真峰/真谷（#3 尾沿 k≈0.34 时峰谷次序仍未破坏） */
const TAN_FLASH: [number, number][] = [
  [TAN_AT - 0.56, 0.16], [TAN_AT, 0.14], [TAN_AT + 0.20, 0.14],
];
const TANG_FR = [0.125, 0.375, 0.625, 0.875];          // 峰/谷定格切线（现状语汇 keep）
const TICKS: [number, string][] = [
  [0.2, '1e3'], [0.4, '1e6'], [0.58, '1e12'], [0.74, '1e24'], [0.84, '1e48'],
];
/* r2c R3 · D 站 x 分段律（列距序列单调不减，全整数格）：
   左段 = 前 20 点严格等距 2.0（整数步进，不经连续式取整——零量化抖动）；
   右段 = 自 2.0 起指数拉开、逐格量化（gap = round(2·e^{0.0462j})，即
   [2×5,3×8,4×5,5×2]，Σ=64），末端恰落 lineX1；衔接首 gap=2.0 无跳变。
   全链 gaps = [2×24, 3×8, 4×5, 5×2]，Σ=102 = lineX1−lineX0（首点=线起点）。 */
const ZTAIL: number[] = [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5];
/* r2c R2 · 极限式两行（数学语汇无人称；14 字形已过 Consolas 普查：
   ⁻ U+207B / ⁿ U+207F / · U+00B7 / ∞ / → 皆真字形，渲染后再逐字符断言） */
const LIM_L1 = 'lim  d·2⁻ⁿ = 0';
const LIM_L2 = ' n→∞';

interface Geo {
  cx: number; rowY: number; R: number; circCy: number; rowW: number;
  wx0: number; wx1: number; waveCy: number; waveA: number;
  xz: number[]; lineX0: number; lineL: number; lineX1: number; aRow: number;
}

function geoOf(g: Grid): Geo {
  const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
  const lineX1 = g.cols - 4;               // 渐近线右端（→ ∞ 紧随其后仍在屏内）
  const lineX0 = Math.round(g.cols * 0.28);  // 线起点 = D 首点（线随首点，宽 ~70% 屏宽）
  // r2c R3 分段律 D 站整数列位（见 ZTAIL 注释；按 cols=147 校准，网格度量
  // 变更需同步 TAIL 总和 = lineX1 − lineX0 − 38）
  const xz: number[] = [];
  for (let i = 0; i < 20; i++) xz.push(lineX0 + 2 * i);   // 左段：严格等距 2.0
  let xz9 = xz[19];
  for (const d of ZTAIL) { xz9 += d; xz.push(xz9); }      // 右段：指数拉开至 lineX1
  return {
    cx,
    rowY: cy,                              // r2b R1：A 排点长在 x 轴上
    // r2b R2：圆心=坐标原点；半径取净空内最大——23 格（弯合中段弧顶摆到
    // 9.8 行，与歌词栈（行 7 底）bands 净空 ~63px ≥50px；r2b 拍板 ≥35% 锚废止）
    R: Math.round(g.cols * 0.156),
    circCy: cy,                            // r2b R2：圆心 = 原点（顶/底弧关于行 23 对称）
    rowW: 2 * (N - 1),                     // 等距 2 格：78 格宽、40 点可数
    wx0: 10, wx1: g.cols - 10, waveCy: cy, // r2b R3：波以 x 轴为平衡位置（峰上谷下）
    waveA: 7,
    xz, lineX0,
    lineL: cx - (Math.round(g.cols / 2) - 8),   // r2d R2：'≈' 线左端 = 背景轴左端（列 8）
    lineX1,
    aRow: cy,                              // r2b R4：渐近线与 x 轴重合
  };
}

const zenoY = (u: number, aRow: number) =>
  aRow - 11 * Math.pow(2, -3.4 * u);       // 净空逐段减半 d→d/2→d/4→…
  // r2c R3 微调（λ 3.8→3.4）：行驻留近似单调 [1,2,2,2,2,3,3,4,6,8,7]，末行
  // 7<8 为停止令截断的结构性残留；d(1)=1.02 ⇒ 全 40 点可见、最近点净空 ~1 格

/** 守恒点列在时刻 t 的位置（四站唯一的形态真值；t 连续 ⇒ 站间无缝交接） */
function ptsPos(geo: Geo, t: number): { x: number; y: number; onWave: boolean }[] {
  const { cx, rowY, R, circCy, rowW, wx0, wx1, waveCy, waveA, xz, aRow } = geo;
  const L1 = 2 * Math.PI * R;
  const kb = ease(clamp01((t - BEND_T0) / BEND_DUR));
  const kf = ease(clamp01((t - FLAT_T0) / FLAT_DUR));
  const wv = ease(clamp01((t - WAVE_T0) / WAVE_DUR)) * (1 + RAMP);
  const q = clamp01((t - ZENO_T0) / ZX_DUR);
  const ky = ease(clamp01((t - ZY_T0) / ZY_DUR));
  const P: { x: number; y: number; onWave: boolean }[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    let x: number, y: number, onWave = false;
    if (t >= WAVE_T0) {
      // C②：轴上一排点自左向右起波成正弦（传播感：前沿 wv 扫过，
      // 前沿左侧已落位 '≈/~'，右侧仍伏在轴上）
      x = wx0 + u * (wx1 - wx0);
      const m = ease(clamp01((wv - u) / RAMP));
      y = waveCy + waveA * Math.sin(4 * Math.PI * u) * m;
      onWave = m >= 0.5;
    } else if (kf > 0) {
      // C①：圆收拢/压平成 x 轴上一条水平直线（回到"一排点"）——
      // 纵向塌向轴、横向铺至波的基础匀排；kf=0 与 B 尾态（闭合圆）连续，
      // kf=1 与 C② 0 时刻（轴上一排）连续
      const th = (u - 0.5) * Math.PI * 2;
      const Cx = cx + R * Math.sin(th);
      const Cy = circCy - R * ASP * Math.cos(th);
      x = Cx + (wx0 + u * (wx1 - wx0) - Cx) * kf;
      y = Cy + (rowY - Cy) * kf;
    } else if (kb > 1e-4) {
      // B：轴上一排点弯合成圆（圆心=原点）——曲率与放距同时增长，
      // 两端弯拱、首尾相接于底部。弧竖直中心逐帧锚在 circCy=cy
      // （hArc 随曲率重对中，中段不甩出屏）；kb→0 与 A 排严格连续
      const k = (2 * Math.PI * kb) / L1;
      const Lb = rowW + (L1 - rowW) * kb;
      const th = k * (u - 0.5) * Lb;
      const hArc = ((1 - Math.cos(k * 0.5 * Lb)) / (2 * k)) * ASP;
      const ay = circCy + (rowY - circCy) * (1 - kb) - hArc;
      x = cx + Math.sin(th) / k;
      y = ay + ((1 - Math.cos(th)) / k) * ASP;
    } else {
      // A：x 轴上一排等距离散点（列距 2 格，可数）
      x = cx + (u - 0.5) * rowW;
      y = rowY;
    }
    if (t >= ZENO_T0) {
      // D：正弦 → Zeno 点列。x 前沿自左向右传播（q−0.6u 错峰）落位到
      // 分段律整数列位 xz[i]，全列同步压幅并抬入 x 轴上方（ky），
      // 波纹字符随到位褪回 '·'
      const ex = ease(clamp01((q - 0.6 * u) / 0.4));
      x += (xz[i] - x) * ex;
      y += (zenoY(u, aRow) - y) * ky;
      onWave = onWave && ex < 0.5;
    }
    P.push({ x, y, onWave });
  }
  return P;
}

/** 点列字符：A/B/D 与过渡态一律 '·'（等距直陈、可数），波上 '≈'/'~'
    （现状方言）——四站同一规则，站分支切换帧字符与位置都连续 */
function charOf(P: { onWave: boolean }[], i: number): string {
  if (!P[i].onWave) return '·';
  return Math.cos(4 * Math.PI * (i / (N - 1))) >= 0 ? '≈' : '~';
}

/** 匿名光标（观众化身，无人称标注）：骑波（身下实时切线）→ 滑落 →
    坐进渐近线（=x 轴，"你"的高度线就位，常驻至变暗溶解） */
function drawCursor(
  g: Grid, geo: Geo, t: number, P: { x: number; y: number }[], tier: number,
): void {
  if (t < RIDE_T0 || t >= WINDOWS.verse1[3][1]) return;
  const { wx0, wx1, waveCy, waveA, aRow } = geo;
  const xc = wx0 + 0.92 * (wx1 - wx0);
  let x: number, y: number, ci: number;
  if (t < RIDE_T0 + RIDE_DUR) {
    // 骑在波上：吸附最近波上点（同行），身下实时画该点切线（1 条随动）
    const ic = Math.round(0.92 * ease(clamp01((t - RIDE_T0) / RIDE_DUR)) * (N - 1));
    x = P[ic].x; y = P[ic].y;
    const m = (waveA * Math.cos(4 * Math.PI * (ic / (N - 1))) * 4 * Math.PI) / (wx1 - wx0);
    for (let s = -4; s <= 4; s++) {
      g.put(x + s, y + s * m, s === 0 ? '╬' : m < -0.28 ? '/' : m > 0.28 ? '\\' : '─', 2);
    }
    ci = 3;
  } else if (t < RIDE_T0 + RIDE_DUR + GLIDE_DUR) {
    // 沿右端波位滑落到渐近线（x 轴）
    const uEnd = Math.round(0.92 * (N - 1)) / (N - 1);
    const y0 = waveCy + waveA * Math.sin(4 * Math.PI * uEnd);
    x = xc;
    y = y0 + (aRow - y0) * ease(clamp01((t - (RIDE_T0 + RIDE_DUR)) / GLIDE_DUR));
    ci = 3;
  } else {
    x = xc; y = aRow;                     // 落座于线上，随线铺开而安坐
    ci = 2;
  }
  g.put(x, y, '▮', Math.min(ci, tier));
}

/** S01 · 29.7–44.45 · VERSE 1 — 点列四部曲（归轴版）：轴上排点→原点圆→轴平衡正弦→轴渐近线 */
export const draw = (g: Grid, t: number): void => {
  const cx = Math.round(g.cols / 2), cy = Math.round(g.rows / 2);
  // ambient coordinate grid（keep：全宽点线轴退为背景；原点 '+' 留在圆心=留空语义）
  axes(g, cx, cy, Math.round(g.cols / 2) - 8, g.rows - 8, 1);

  // lyrics stack top-left（keep）
  L.forEach((ln, i) => typeLine(g, 6, 3 + i * 2, ln, t, T.verse1[i], 24, WINDOWS.verse1[i][1]));

  const geo = geoOf(g);
  const P = ptsPos(geo, t);
  let tier = 4;

  if (t < T.verse1[1]) {
    /* A（V1-L1）：x 轴上一排等距点；DIMENSION 唱出时上下各克隆一排影子
       （轴 ±2 行内脉冲、即收，离散点克隆 ≤0.8s，与 INTRO-L4 网格不同貌） */
    const count = Math.floor(N * ease(clamp01((t - LEAD0) / 1.0)));
    const age = t - UPG_T0;
    const env = age >= 0 && age <= UPG_DUR ? Math.sin((Math.PI * age) / UPG_DUR) : 0;
    const dy = Math.round(env * 2);        // 峰值 ±2：上排行 21 / 下排行 25
    const flash = age >= 0 && age < 0.3;
    for (let i = 0; i < count && i < N; i++) {
      const { x, y } = P[i];
      g.put(x, y, charOf(P, i), flash ? 4 : 3);
      if (dy >= 1) {                       // 升维一瞬：轴上下各一排小点阵
        g.put(x, y + dy, '·', 2);
        g.put(x, y - dy, '·', 2);
      }
    }
  } else if (t < T.verse1[2]) {
    /* B（V1-L2）：弯合成圆（圆心=原点，圆心留空=给你坐的位置）；
       高亮弧沿周长流转 + C = 2πr（keep 语汇）。压平一启动即离场 */
    for (let i = 0; i < N; i++) g.put(P[i].x, P[i].y, charOf(P, i), 3);
    if (t >= BEND_T0 + BEND_DUR && t < FLAT_T0) {
      const th0 = (t - (BEND_T0 + BEND_DUR + 0.1)) * 1.6;
      for (let k = 0; k < 7; k++) {
        const th = th0 + k * 0.09;
        g.put(geo.cx + geo.R * Math.sin(th), geo.circCy - geo.R * ASP * Math.cos(th), '#', 4);
      }
      g.center(Math.round(geo.circCy + geo.R * ASP + 1.5), 'C = 2πr', 3);
    }
  } else if (t < T.verse1[3]) {
    /* C（V1-L3）：圆压平回轴上一排点 → 自左向右起波成正弦；
       TANGENTS 前后峰/谷切线敲定闪现（闪窗全部先于 y 动线变形） */
    for (let i = 0; i < N; i++) g.put(P[i].x, P[i].y, charOf(P, i), 3);
    for (const [f0, fd] of TAN_FLASH) {
      if (t < f0 || t >= f0 + fd) continue;
      /* r2d R1（A 案）：峰/谷处导数为 0，定格切线即水平段 ───╬───
         （╬=接触点、两侧各 3 格；与光标活切线 m≈0 的 '─' 分支语汇自洽，
         全段仍只有"随动线 + 定格水平段"两种切线形态） */
      TANG_FR.forEach((fr) => {
        const idx = Math.round(fr * (N - 1));
        const px = Math.round(P[idx].x), py = Math.round(P[idx].y);
        for (let s = -3; s <= 3; s++) g.put(px + s, py, s === 0 ? '╬' : '─', 4);
      });
      break;
    }
  } else {
    /* D（V1-L4）：Zeno 点列——x 指数拉开奔向 ∞（刻度随点点亮），
       自上方向 x 轴贴近、净空逐段减半；亚格级即止（净空 <1 格不渲染）：
       可见尽头之外不画，宁可少、不可触。末段定格后变暗溶解收进 PRE-CHORUS */
    const fd = clamp01((WINDOWS.verse1[3][1] - t) / 0.5);
    tier = t < DISS_T0 ? 4 : fd > 0.6 ? 4 : fd > 0.2 ? 2 : 1;
    for (let i = 0; i < N; i++) {
      const { x, y } = P[i];
      const cr = geo.aRow - y;                     // 当前净空（行）
      if (cr < 1) continue;                        // 硬停止令
      const ci = Math.min(cr >= 3 ? 3 : cr >= 1.8 ? 2 : 1, tier);
      g.put(x, y, charOf(P, i), ci);
    }
    if (t >= LINE_T0) {
      const ld = ease(clamp01((t - LINE_T0) / LINE_DUR));
      const xc = geo.wx0 + 0.92 * (geo.wx1 - geo.wx0);
      const xl = Math.round(xc - (xc - geo.lineL) * ld);   // 左铺至背景轴左端（r2d R2）
      const xr = Math.round(xc + (geo.lineX1 - xc) * ld);
      for (let x = xl; x <= xr; x++) g.put(x, geo.aRow, '≈', Math.min(2, tier));
    }
    let lastLit = -1;
    TICKS.forEach(([ut, lab], j) => {
      const it = Math.round(ut * (N - 1));                 // 刻度锚在对应点位上
      const lit = ZENO_T0 + ZX_DUR * (0.6 * (it / (N - 1)) + 0.4);   // 随点到位点亮
      if (t >= lit) {
        lastLit = j;
        g.puts(geo.xz[it] - 1, geo.aRow + 2, lab,
          Math.min(t < lit + 0.3 ? 4 : 3, tier));
      }
    });
    if (lastLit === TICKS.length - 1)
      g.puts(geo.lineX1 + 1, geo.aRow, '→ ∞', Math.min(3, tier));
    if (t >= LINE_T0 + 0.2) {                       // 极限式两行（轴下左区，r2c R2）
      g.puts(geo.lineX0 + 5, geo.aRow + 4, LIM_L1, Math.min(2, tier));
      g.puts(geo.lineX0 + 5, geo.aRow + 5, LIM_L2, Math.min(2, tier));
    }
  }

  drawCursor(g, geo, t, P, tier);   // 跨 C/D 分支的观众动线（最上层）
};
