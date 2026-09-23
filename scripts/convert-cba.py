"""
Convierte el Comentario Biblico Adventista (CBA) desde NRVA-Reader a JSON gateway.

Origen (formato NRVA):
  <origen>/public/data/commentary/<codigo>.json  (66 ficheros, minusculas)
  { metadata, introduction{fullTitle, subtitle, sections[{title, content}]},
    chapters:[{chapter, verses:[{verse, phrase, content, references[]}]}] }

Salida (formato gateway, ver CommentaryBookData):
  public/data/commentaries/cba/<BOOK>.json  (66 ficheros, mayusculas)
  + entrada "cba" al frente de public/data/commentaries/index.json

Uso:
  python scripts/convert-cba.py [--source DIR] [--only GEN]
  CBA_SOURCE_DIR env var como alternativa a --source.
  Default: /home/j/NRVA-Reader/public/data/commentary
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path("/home/j/NRVA-Reader/public/data/commentary")
OUTPUT_ROOT = PROJECT_ROOT / "public" / "data" / "commentaries" / "cba"
INDEX_PATH = PROJECT_ROOT / "public" / "data" / "commentaries" / "index.json"

SOURCE_ID = "cba"

# Codigo de fichero NRVA (minusculas) -> codigo de libro gateway (mayusculas)
NRVA_TO_GATEWAY = {
    "gen": "GEN", "exo": "EXO", "lev": "LEV", "num": "NUM", "deu": "DEU",
    "jos": "JOS", "jdg": "JDG", "rut": "RUT", "1sa": "1SA", "2sa": "2SA",
    "1ki": "1KI", "2ki": "2KI", "1ch": "1CH", "2ch": "2CH", "ezr": "EZR",
    "neh": "NEH", "est": "EST", "job": "JOB", "psa": "PSA", "pro": "PRO",
    "ecc": "ECC", "sol": "SNG", "isa": "ISA", "jer": "JER", "lam": "LAM",
    "eze": "EZK", "dan": "DAN", "hos": "HOS", "joe": "JOL", "amo": "AMO",
    "oba": "OBA", "jon": "JON", "mic": "MIC", "nah": "NAM", "hab": "HAB",
    "zep": "ZEP", "hag": "HAG", "zec": "ZEC", "mal": "MAL", "mat": "MAT",
    "mrk": "MRK", "luk": "LUK", "jhn": "JHN", "act": "ACT", "rom": "ROM",
    "1co": "1CO", "2co": "2CO", "gal": "GAL", "eph": "EPH", "phi": "PHP",
    "col": "COL", "1th": "1TH", "2th": "2TH", "1ti": "1TI", "2ti": "2TI",
    "tit": "TIT", "phm": "PHM", "heb": "HEB", "jam": "JAS", "1pe": "1PE",
    "2pe": "2PE", "1jo": "1JN", "2jo": "2JN", "3jo": "3JN", "jud": "JUD",
    "rev": "REV",
}


def render_verse_text(verse: dict) -> str:
    phrase = (verse.get("phrase") or "").strip()
    content = (verse.get("content") or "").strip()
    refs = verse.get("references") or []
    text = f"{phrase} — {content}" if phrase and content else (content or phrase)
    if refs:
        text = f"{text} (Cf. {'; '.join(str(r) for r in refs)})"
    return text


def render_intro_section(section: dict) -> str:
    title = (section.get("title") or "").strip().rstrip(".")
    content = (section.get("content") or "").strip()
    if title and content:
        return f"{title}: {content}"
    return content or title


def convert_book(nrva_code: str, data: dict) -> dict:
    gateway_code = NRVA_TO_GATEWAY[nrva_code]
    metadata = data.get("metadata") or {}
    intro = data.get("introduction") or {}
    chapters = data.get("chapters") or []

    book_comments: list[str] = []
    full_title = (intro.get("fullTitle") or "").strip()
    subtitle = (intro.get("subtitle") or "").strip()
    if full_title:
        book_comments.append(full_title + (f" — {subtitle}" if subtitle else ""))
    for section in intro.get("sections") or []:
        rendered = render_intro_section(section)
        if rendered:
            book_comments.append(rendered)

    out_chapters: dict[str, dict] = {}
    total_entries = 0
    for ch in chapters:
        try:
            ch_num = int(ch.get("chapter"))
        except (TypeError, ValueError):
            continue
        verse_comments: dict[str, str] = {}
        for v in ch.get("verses") or []:
            try:
                v_num = int(v.get("verse"))
            except (TypeError, ValueError):
                continue
            text = render_verse_text(v)
            if not text:
                continue
            key = str(v_num)
            if key in verse_comments:
                # La fuente trae comentarios adicionales del mismo versículo:
                # se fusionan en vez de sobrescribirse.
                verse_comments[key] = f"{verse_comments[key]}\n\n{text}"
            else:
                verse_comments[key] = text
                total_entries += 1
        out_chapters[str(ch_num)] = {"chapterComments": [], "verseComments": verse_comments}

    return {
        "id": SOURCE_ID,
        "moduleId": "CBA",
        "title": "Comentario Bíblico Adventista",
        "author": "Review and Herald / ACES",
        "description": "Comentario bíblico completo en español, versículo por versículo, con introducción por libro.",
        "language": "es",
        "sourceType": "CBA",
        "license": "Uso autorizado",
        "textSource": "NRVA-Reader",
        "totalEntries": total_entries,
        "totalBooks": 1,
        "bookCodes": [gateway_code],
        "bookCode": gateway_code,
        "bookName": str(metadata.get("name") or gateway_code),
        "bookComments": book_comments,
        "chapters": out_chapters,
    }


def update_index(sources_meta: list[dict]) -> dict:
    with open(INDEX_PATH, encoding="utf-8") as f:
        index = json.load(f)
    book_codes = sorted(m["bookCode"] for m in sources_meta)
    total_entries = sum(m["totalEntries"] for m in sources_meta)
    cba_source = {
        "id": SOURCE_ID,
        "moduleId": "CBA",
        "title": "Comentario Bíblico Adventista",
        "author": "Review and Herald / ACES",
        "description": "Comentario bíblico completo en español, versículo por versículo, con introducción por libro.",
        "language": "es",
        "sourceType": "CBA",
        "license": "Uso autorizado",
        "textSource": "NRVA-Reader",
        "totalEntries": total_entries,
        "totalBooks": len(sources_meta),
        "bookCodes": book_codes,
    }
    sources = [s for s in index.get("sources", []) if s.get("id") != SOURCE_ID]
    sources.insert(0, cba_source)
    index["sources"] = sources
    return index


def main() -> int:
    parser = argparse.ArgumentParser(description="Convierte el CBA de NRVA-Reader al formato gateway.")
    parser.add_argument("--source", default=os.environ.get("CBA_SOURCE_DIR", str(DEFAULT_SOURCE)))
    parser.add_argument("--only", default=None, help="Convierte solo un libro NRVA (ej. gen)")
    args = parser.parse_args()

    source_root = Path(args.source)
    if not source_root.is_dir():
        print(f"Origen no encontrado: {source_root}", file=sys.stderr)
        return 1

    codes = [args.only.lower()] if args.only else sorted(NRVA_TO_GATEWAY)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    converted: list[dict] = []
    for code in codes:
        if code not in NRVA_TO_GATEWAY:
            print(f"Código desconocido: {code}", file=sys.stderr)
            return 1
        src = source_root / f"{code}.json"
        if not src.is_file():
            print(f"Falta fichero origen: {src}", file=sys.stderr)
            return 1
        with open(src, encoding="utf-8") as f:
            data = json.load(f)
        book = convert_book(code, data)
        dest = OUTPUT_ROOT / f"{NRVA_TO_GATEWAY[code]}.json"
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(book, f, ensure_ascii=False)
        converted.append(book)
        print(f"{code} -> {dest.name} ({book['totalEntries']} versículos)")

    if not args.only:
        index = update_index(converted)
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"index.json actualizado: cba primero ({len(converted)} libros)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
