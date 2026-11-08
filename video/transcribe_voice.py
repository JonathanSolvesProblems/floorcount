"""Transcribe the voice take with word timestamps:  py tmp/transcribe_voice.py broll/voice-raw.wav tmp/voice-words.json"""
import json
import sys

from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(
    src,
    word_timestamps=True,
    initial_prompt="Floorcount, a Lens for Specs, Snap's AR glasses, built with CLAD in Lens Studio through the Lens Studio MCP. Salsa, the eight-count, the right turn, LEAF scenarios, Devpost skill pack, sole prints, the clave.",
)
words = []
segs = []
for s in segments:
    segs.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
    for w in s.words or []:
        words.append({"start": round(w.start, 2), "end": round(w.end, 2), "word": w.word})
json.dump({"segments": segs, "words": words}, open(out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for s in segs:
    print(f"{s['start']:7.2f} {s['end']:7.2f}  {s['text']}")
