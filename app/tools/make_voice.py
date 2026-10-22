#!/usr/bin/env python
"""Make the English and Urdu voice-over mp3 files for a model's parts.

It reads textEn and textUr of each part straight from src/mock/subjects.ts (it does not rewrite the text)
and writes public/audio/<model>/<partId>-en.mp3 and <partId>-ur.mp3.

Uses the free `edge-tts` package. No API key and no account. It needs an internet connection while it
runs, because the speech is made by Microsoft's online voices. Nothing is uploaded except the part text.

Run it from the app/ folder:

    pip install edge-tts
    python tools/make_voice.py                 # Electricity generator (default)
    python tools/make_voice.py generator       # same, named
    python tools/make_voice.py --list          # show what it would say, make nothing

Safe to re-run: it overwrites the files. After changing a text in subjects.ts, run it again.
"""
import argparse
import asyncio
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
SOURCE = APP / "src" / "mock" / "subjects.ts"

# Voices. The first voice for a language is tried first; the next is the fallback if it fails.
VOICES = {
    "en": ["en-US-AriaNeural", "en-GB-SoniaNeural"],
    "ur": ["ur-PK-UzmaNeural", "ur-PK-AsadNeural"],
}

# model id -> name of the content constant in subjects.ts
CONTENT_CONST = {"generator": "generatorContent"}


def ts_string(raw: str) -> str:
    """Turn the inside of a single-quoted TypeScript string into plain text."""
    return re.sub(r"\\(.)", lambda m: {"n": "\n"}.get(m.group(1), m.group(1)), raw)


def read_parts(model: str):
    const = CONTENT_CONST.get(model)
    if not const:
        sys.exit(f"Unknown model '{model}'. Known: {', '.join(CONTENT_CONST)}")
    text = SOURCE.read_text(encoding="utf-8")
    start = text.find(f"export const {const}")
    if start < 0:
        sys.exit(f"Could not find {const} in {SOURCE}")
    end = text.find("\n}\n", start)
    block = text[start:end]
    parts = []
    # each part starts at "id: '...'"
    pieces = re.split(r"\n\s*id: '", block)[1:]
    for piece in pieces:
        part_id = piece.split("'", 1)[0]
        en = re.search(r"textEn:\s*'((?:[^'\\]|\\.)*)'", piece)
        ur = re.search(r"textUr:\s*'((?:[^'\\]|\\.)*)'", piece)
        if not en or not ur:
            sys.exit(f"Part '{part_id}' has no textEn/textUr in {SOURCE}")
        parts.append((part_id, ts_string(en.group(1)), ts_string(ur.group(1))))
    if not parts:
        sys.exit(f"No parts found in {const}")
    return parts


async def speak(text: str, lang: str, out: Path) -> str:
    import edge_tts

    last = None
    for voice in VOICES[lang]:
        try:
            await edge_tts.Communicate(text, voice).save(str(out))  # mono mp3
            if out.exists() and out.stat().st_size > 0:
                return voice
        except Exception as e:  # try the next voice
            last = e
    raise RuntimeError(f"No voice worked for {lang}: {last}")


async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("model", nargs="?", default="generator")
    ap.add_argument("--list", action="store_true", help="only print the texts")
    args = ap.parse_args()

    parts = read_parts(args.model)
    out_dir = APP / "public" / "audio" / args.model
    if not args.list:
        out_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    for part_id, en, ur in parts:
        for lang, text in (("en", en), ("ur", ur)):
            name = f"{part_id}-{lang}.mp3"
            if args.list:
                print(f"{name}: {text}")
                continue
            voice = await speak(text, lang, out_dir / name)
            size = (out_dir / name).stat().st_size
            total += size
            print(f"{name:22} {size / 1024:6.1f} KB  {voice}")
    if not args.list:
        print(f"total {total / 1024:.1f} KB in {out_dir.relative_to(APP)}")


if __name__ == "__main__":
    asyncio.run(main())
