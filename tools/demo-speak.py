"""Speak lines with Kokoro-82M (hexgrad/Kokoro-82M; Apache-2.0 code and weights), one WAV per line.

    python demo-speak.py lines.json out-dir [voice] [speed]

lines.json: [{"id": "purpose", "text": "..."}]. Writes out-dir/<id>.wav (24 kHz mono). The voice is
`af_heart`, an open-source American female voice; no real person's voice is cloned. Run it from a
Python 3.11 environment that has `kokoro` and `soundfile` (and the spaCy model Kokoro's text front end uses).
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

lines = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
voice = sys.argv[3] if len(sys.argv) > 3 else "af_heart"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
out.mkdir(parents=True, exist_ok=True)
pipe = KPipeline(lang_code="b" if voice.startswith("b") else "a", repo_id="hexgrad/Kokoro-82M")
SR = 24000
for item in lines:
    parts = [np.asarray(audio) for _, _, audio in pipe(item["text"], voice=voice, speed=speed, split_pattern=r"\n+")]
    wav = np.concatenate(parts)
    sf.write(str(out / f"{item['id']}.wav"), wav, SR)
    print(f"{item['id']}  {len(wav) / SR:5.2f}s", flush=True)
