"""
Copia los datos interlineales hebreo/griego desde NRVA-Reader al gateway,
renombrando a códigos de libro gateway (BOOK.json).

Origen:
  <origen>/public/data/bible/{hebrew,greek}/<nombre-ingles>.json (66 ficheros)
  [{chapter, verse, words: [{hebrew|greek, parsing, strong, spanish}]}]

Salida (copia byte-idéntica, solo cambia el nombre):
  public/data/interlinear/{hebrew,greek}/<BOOK>.json

Uso:
  python scripts/convert-interlinear.py [--source DIR]
  INTERLINEAR_SOURCE_DIR env var como alternativa a --source.
  Default: /home/j/NRVA-Reader/public/data/bible
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path("/home/j/NRVA-Reader/public/data/bible")
OUTPUT_ROOT = PROJECT_ROOT / "public" / "data" / "interlinear"

# Código gateway -> (testamento, fichero NRVA)
BOOK_FILES: dict[str, tuple[str, str]] = {
    "GEN": ("hebrew", "genesis"), "EXO": ("hebrew", "exodus"), "LEV": ("hebrew", "leviticus"),
    "NUM": ("hebrew", "numbers"), "DEU": ("hebrew", "deuteronomy"), "JOS": ("hebrew", "joshua"),
    "JDG": ("hebrew", "judges"), "RUT": ("hebrew", "ruth"), "1SA": ("hebrew", "1_samuel"),
    "2SA": ("hebrew", "2_samuel"), "1KI": ("hebrew", "1_kings"), "2KI": ("hebrew", "2_kings"),
    "1CH": ("hebrew", "1_chronicles"), "2CH": ("hebrew", "2_chronicles"), "EZR": ("hebrew", "ezra"),
    "NEH": ("hebrew", "nehemiah"), "EST": ("hebrew", "esther"), "JOB": ("hebrew", "job"),
    "PSA": ("hebrew", "psalms"), "PRO": ("hebrew", "proverbs"), "ECC": ("hebrew", "ecclesiastes"),
    "SNG": ("hebrew", "song_of_songs"), "ISA": ("hebrew", "isaiah"), "JER": ("hebrew", "jeremiah"),
    "LAM": ("hebrew", "lamentations"), "EZK": ("hebrew", "ezekiel"), "DAN": ("hebrew", "daniel"),
    "HOS": ("hebrew", "hosea"), "JOL": ("hebrew", "joel"), "AMO": ("hebrew", "amos"),
    "OBA": ("hebrew", "obadiah"), "JON": ("hebrew", "jonah"), "MIC": ("hebrew", "micah"),
    "NAM": ("hebrew", "nahum"), "HAB": ("hebrew", "habakkuk"), "ZEP": ("hebrew", "zephaniah"),
    "HAG": ("hebrew", "haggai"), "ZEC": ("hebrew", "zechariah"), "MAL": ("hebrew", "malachi"),
    "MAT": ("greek", "matthew"), "MRK": ("greek", "mark"), "LUK": ("greek", "luke"),
    "JHN": ("greek", "john"), "ACT": ("greek", "acts"), "ROM": ("greek", "romans"),
    "1CO": ("greek", "1-corinthians"), "2CO": ("greek", "2-corinthians"), "GAL": ("greek", "galatians"),
    "EPH": ("greek", "ephesians"), "PHP": ("greek", "philippians"), "COL": ("greek", "colossians"),
    "1TH": ("greek", "1-thessalonians"), "2TH": ("greek", "2-thessalonians"),
    "1TI": ("greek", "1-timothy"), "2TI": ("greek", "2-timothy"), "TIT": ("greek", "titus"),
    "PHM": ("greek", "philemon"), "HEB": ("greek", "hebrews"), "JAS": ("greek", "james"),
    "1PE": ("greek", "1-peter"), "2PE": ("greek", "2-peter"), "1JN": ("greek", "1-john"),
    "2JN": ("greek", "2-john"), "3JN": ("greek", "3-john"), "JUD": ("greek", "jude"),
    "REV": ("greek", "revelation"),
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Copia datos interlineales NRVA al gateway.")
    parser.add_argument("--source", default=os.environ.get("INTERLINEAR_SOURCE_DIR", str(DEFAULT_SOURCE)))
    parser.add_argument("--only", default=None, help="Copia solo un libro gateway (ej. GEN)")
    args = parser.parse_args()

    source_root = Path(args.source)
    if not source_root.is_dir():
        print(f"Origen no encontrado: {source_root}", file=sys.stderr)
        return 1

    codes = [args.only.upper()] if args.only else sorted(BOOK_FILES)
    copied = 0
    for code in codes:
        if code not in BOOK_FILES:
            print(f"Código desconocido: {code}", file=sys.stderr)
            return 1
        testament, filename = BOOK_FILES[code]
        src = source_root / testament / f"{filename}.json"
        if not src.is_file():
            print(f"Falta fichero origen: {src}", file=sys.stderr)
            return 1
        dest = OUTPUT_ROOT / testament / f"{code}.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest)
        copied += 1
        print(f"{testament}/{filename}.json -> {testament}/{code}.json")

    print(f"Copiados {copied} libros interlineales.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
