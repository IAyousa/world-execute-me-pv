# PRODUCTION helper: dump the MIDI as compact JSON for the Remotion engine.
import sys, json
import mido


def main(path, out):
    mf = mido.MidiFile(path)
    tpb = mf.ticks_per_beat
    tempos = []
    raw = []
    for tr in mf.tracks:
        t = 0
        for msg in tr:
            t += msg.time
            if msg.type == 'set_tempo':
                tempos.append([t, msg.tempo])
    tempos.sort()
    dedup = []
    for tt, tp in tempos:
        if not dedup or dedup[-1][1] != tp:
            dedup.append([tt, tp])

    def t2s(tick):
        s, lt, tp = 0.0, 0, 500000
        for tt, us in dedup:
            if tt >= tick:
                break
            s += (tt - lt) / tpb * (us / 1e6)
            lt, tp = tt, us
        return s + (tick - lt) / tpb * (tp / 1e6)

    for tr in mf.tracks:
        t = 0
        open_n = {}
        for msg in tr:
            t += msg.time
            if msg.type == 'program_change':
                raw.append([t, msg.channel, -1, msg.program, 0])
            elif msg.type in ('note_on', 'note_off'):
                on = msg.type == 'note_on' and msg.velocity > 0
                key = (msg.channel, msg.note)
                if on:
                    open_n.setdefault(key, []).append((t, msg.velocity))
                else:
                    st = open_n.get(key)
                    if st:
                        s, v = st.pop()
                        raw.append([s, msg.channel, msg.note, v, t - s])
    raw.sort(key=lambda e: e[0])

    prog, notes = {}, []
    for tick, ch, p, v, dur in raw:
        if p == -1:
            prog.setdefault(str(ch), v)
            continue
        s = t2s(tick)
        notes.append([round(s, 3), round(t2s(tick + dur) - s, 3), p, v, ch])
    notes.sort()
    data = {
        'bpm': round(60e6 / (dedup[0][1] if dedup else 500000), 3),
        'len': round(max(n[0] + n[1] for n in notes), 3),
        'prog': prog,
        'notes': notes,
    }
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
    print(f'wrote {out}: {len(notes)} notes, len={data["len"]}s, bpm={data["bpm"]}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
