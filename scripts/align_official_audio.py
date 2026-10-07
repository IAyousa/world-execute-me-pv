# 官方音频 vs MIDI 芯片轨 对齐分析
# 方法： onset 包络互相关 (音色无关, 只看节奏结构)
# 输出: 最优滞后(秒) 与置信度, 以及分段滞后抽查 (检测速度漂移)
import subprocess, sys, io, wave
import numpy as np

OFFICIAL = sys.argv[1] if len(sys.argv) > 1 else "world.execute (me) ;.mp3"
CHIPTUNE = sys.argv[2] if len(sys.argv) > 2 else "out/chiptune_v2.wav"
SR = 22050


def decode_mono(path):
    # 经 ffmpeg 转 22050Hz 单声道 16bit PCM, 进程管道读取
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "wav",
         "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True).stdout
    w = wave.open(io.BytesIO(raw))
    assert w.getsampwidth() == 2 and w.getnchannels() == 1
    data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    return data.astype(np.float64) / 32768.0


def onset_envelope(x, hop=256):
    # 分帧 RMS -> 正差分 (能量上升沿) -> 平滑
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))
    diff = np.maximum(np.diff(rms, prepend=rms[0]), 0.0)
    k = np.hanning(9); k /= k.sum()
    return np.convolve(diff, k, mode="same")


def xcorr_lag(a, b, max_lag_sec):
    a = (a - a.mean()) / (a.std() + 1e-12)
    b = (b - b.mean()) / (b.std() + 1e-12)
    full = np.correlate(a, b, mode="full")  # lag = argmax - (len(b)-1): a 领先 b
    lags = np.arange(-len(b) + 1, len(a))
    m = np.abs(lags) <= max_lag_sec * SR / 256
    seg = np.where(m)[0]
    peak = seg[np.argmax(full[seg])]
    return lags[peak] * 256 / SR, full[peak] / min(len(a), len(b))


off = decode_mono(OFFICIAL)
chi = decode_mono(CHIPTUNE)
print(f"official {len(off)/SR:.2f}s  chiptune {len(chi)/SR:.2f}s")

eo = onset_envelope(off)
ec = onset_envelope(chi)

# 全曲互相关, ±4s 窗
lag, conf = xcorr_lag(ec, eo, 4.0)
print(f"full-song best lag (chiptune vs official): {lag:+.3f}s  conf={conf:.3f}")

# 分段抽查: 每 40s 一段, 各自找滞后 (同一滞后 => 无速度漂移)
fps = SR / 256  # 包络帧率
for start in range(0, int(len(off) / SR) - 10, 40):
    i0, i1 = int(start * fps), int(min(start + 40, len(off) / SR - 2) * fps)
    l, c = xcorr_lag(ec[i0:i1], eo[i0:i1], 2.0)
    print(f"  {start:3d}-{start+40:3d}s  lag={l:+.3f}s  conf={c:.3f}")
