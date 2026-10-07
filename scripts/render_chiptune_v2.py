# chiptune renderer — MIDI -> WAV via a small square/triangle/saw synth.
#
# usage: python scripts/render_chiptune_v2.py <midi> <out.wav> [program_map.json]
#
# PROG maps MIDI channel -> General MIDI program number, which selects each
# channel's synth voice (33 bass/tri, 11 lead/square, 29 guitar/saw,
# 40 violin/saw-slow-attack, others = keys/square; channel 9 = drums by
# pitch). The default below fits the community transcription this project
# was built on -- YOUR midi may assign channels differently, so inspect it
# and pass your own map:  {"0": 33, "1": 11, ...}
#
# mixing notes (v2): drums = FFT high-passed noise with 1ms click ramps;
# hats = true short decay; master = peak-normalized to -1 dB, no tanh
# saturation (it drove a beat-synchronized crunch).
import json
import sys, wave
import numpy as np
import mido

SR = 44100
PROG = {0: 33, 1: 11, 2: 29, 3: 0, 4: 33, 5: 40, 9: 0}


def build_t2s(mf):
    tempos, tpb = [], mf.ticks_per_beat
    for tr in mf.tracks:
        t = 0
        for msg in tr:
            t += msg.time
            if msg.type == 'set_tempo':
                tempos.append((t, msg.tempo))
    tempos.sort()
    dedup = []
    for tt, tp in tempos:
        if not dedup or dedup[-1][1] != tp:
            dedup.append((tt, tp))

    def t2s(tick):
        s, lt, tp = 0.0, 0, 500000
        for tt, us in dedup:
            if tt >= tick:
                break
            s += (tt - lt) / tpb * (us / 1e6)
            lt, tp = tt, us
        return s + (tick - lt) / tpb * (tp / 1e6)
    return t2s


def collect(mf):
    t2s = build_t2s(mf)
    raw = []
    for tr in mf.tracks:
        t = 0
        open_n = {}
        for msg in tr:
            t += msg.time
            if msg.type in ('note_on', 'note_off'):
                key = (msg.channel, msg.note)
                if msg.type == 'note_on' and msg.velocity > 0:
                    open_n.setdefault(key, []).append((t, msg.velocity))
                else:
                    st = open_n.get(key)
                    if st:
                        s, v = st.pop()
                        raw.append((t2s(s), t2s(t) - t2s(s), msg.note, v, msg.channel))
    raw.sort()
    return raw


def env(n, dur, atk, rel):
    t = np.arange(n) / SR
    e = np.minimum(t / max(atk, 1e-4), 1.0)
    hold = max(n - int(rel * SR), int(atk * SR) + 1)
    tail = n - hold
    if tail > 0:
        e[hold:] *= np.exp(-np.arange(tail) / (SR * rel / 4))
    return e * np.minimum(dur, 1e9)


def osc(f, n, kind):
    # additive synthesis: only harmonics below 14 kHz -> zero aliasing, softer edge
    t = np.arange(n) / SR
    kmax = max(1, min(int(14000 / f), 24))
    x = np.zeros(n)
    if kind == 'tri':
        for k in range(1, kmax + 1, 2):
            x += np.sin(2 * np.pi * f * k * t) / (k * k)
        return x * (8 / np.pi ** 2)
    if kind == 'saw':
        for k in range(1, kmax + 1):
            x += np.sin(2 * np.pi * f * k * t) / k
        return x * (2 / np.pi) * 0.9
    if kind == 'sq':
        for k in range(1, kmax + 1, 2):
            x += np.sin(2 * np.pi * f * k * t) / k
        return x * (4 / np.pi) * 0.85
    return x


def hp_noise(n, cutoff_hz, rng):
    """zero-phase FFT high-passed white noise, unit-ish peak"""
    x = rng.standard_normal(n)
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec[freqs < cutoff_hz] = 0
    y = np.fft.irfft(spec, n)
    return y / max(1e-9, np.abs(y).max())


def ramp(x, ms=1.0):
    k = max(1, int(SR * ms / 1000))
    if len(x) > 2 * k:
        x[:k] *= np.linspace(0, 1, k)
        x[-k:] *= np.linspace(1, 0, k)
    return x


def main(path, out_wav):
    mf = mido.MidiFile(path)
    notes = collect(mf)
    total = max(n[0] + n[1] for n in notes) + 4.0
    buf = np.zeros(int(total * SR) + SR)
    rng = np.random.default_rng(617)

    def add(t, x):
        i0 = int(t * SR)
        i1 = min(i0 + len(x), len(buf))
        if i0 < len(buf):
            buf[i0:i1] += x[: i1 - i0]

    for t, d, p, v, ch in notes:
        if v <= 15:
            continue
        f = 440 * 2 ** ((p - 69) / 12)
        vel = v / 127
        if ch == 9:
            if p < 38:  # kick — sine drop, soft
                n = int(0.5 * SR)
                fr = 140 * np.exp(-np.arange(n) / SR / 0.04) + 40
                x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-np.arange(n) / SR / 0.06) * .60 * vel
            elif p < 48:  # snare — HP-filtered noise + tonal body
                n = int(0.35 * SR)
                body = np.sin(2 * np.pi * 190 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR / 0.04) * .10
                x = hp_noise(n, 900, rng) * np.exp(-np.arange(n) / SR / 0.06) * .30 * vel + body * vel
            elif p < 53:  # hats — soft top, short
                n = int(0.07 * SR)
                x = hp_noise(n, 6200, rng) * np.exp(-np.arange(n) / SR / 0.016) * .11 * vel
            else:  # crash shimmer
                n = int(0.9 * SR)
                x = hp_noise(n, 5000, rng) * np.exp(-np.arange(n) / SR / 0.25) * .10 * vel
            add(t, ramp(x))
            continue
        pr = PROG.get(ch, 0)
        if pr == 33:      # bass
            n = int((d + .08) * SR)
            x = osc(f, n, 'tri') * env(n, d, .004, .06) * .32 * vel
        elif pr == 11:    # lead — a touch louder now that drums are calmer
            n = int((d + .14) * SR)
            x = osc(f, n, 'sq') * env(n, d, .004, .11) * .11 * vel
        elif pr == 29:    # guitar
            dd = min(d, .6)
            n = int((dd + .08) * SR)
            x = osc(f, n, 'saw') * env(n, dd, .003, .07) * .06 * vel
        elif pr == 40:    # violin
            n = int((d + .3) * SR)
            x = osc(f, n, 'saw') * env(n, d, .09, .22) * .10 * vel
        else:             # keys
            dd = min(d, 1.2)
            n = int((dd + .2) * SR)
            x = osc(f, n, 'sq') * env(n, dd, .004, .16) * .06 * vel
        add(t, x)

    # master: gentle 10–16 kHz rolloff (tames top-end bite), soft-knee, -1 dB peak
    spec = np.fft.rfft(buf)
    freqs = np.fft.rfftfreq(len(buf), 1 / SR)
    hf = np.ones_like(freqs)
    hi = freqs > 10000
    hf[hi] = np.cos((freqs[hi] - 10000) / 6000 * np.pi / 2)
    hf[freqs > 16000] = 0.0
    buf = np.fft.irfft(spec * hf, len(buf))
    knee = 0.7
    m = np.abs(buf) > knee
    buf[m] = np.sign(buf[m]) * (knee + (1 - knee) * np.tanh((np.abs(buf[m]) - knee) / (1 - knee)))
    buf *= 0.891 / max(1e-9, np.abs(buf).max())
    stereo = np.repeat(buf[:, None], 2, axis=1)
    pcm = (stereo * 32767).astype('<i2')
    with wave.open(out_wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    rms = np.sqrt(np.mean(buf ** 2))
    print(f'wrote {out_wav}: {total:.1f}s  peak={np.abs(buf).max():.3f}  rms={rms:.4f}  crest={20*np.log10(np.abs(buf).max()/rms):.1f} dB')


if __name__ == '__main__':
    if len(sys.argv) > 3:
        PROG.update({int(k): v for k, v in json.load(open(sys.argv[3])).items()})
    main(sys.argv[1], sys.argv[2])
