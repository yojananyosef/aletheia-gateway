"""
Rellena los versiculos `missing_local` de la auditoria trayendolos del remoto.

Para cada verso faltante construye las palabras con todos los campos:
hebrew/greek (manuscriptText), parsing (parsingCode en minuscula, formato
local), strong, spanish (gloss), lemma y parsingCode. Las inserta ordenadas
en el JSON gateway correspondiente.

Uso:
  python3 scripts/fill-missing-verses.py [--apply] [--delay 2.0]
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import random
import sys
import time
from pathlib import Path

import importlib.util

_AUDIT_SPEC = importlib.util.spec_from_file_location(
    "audit_interlinear",
    str(Path(__file__).resolve().parent / "audit-interlinear.py"))
_audit = importlib.util.module_from_spec(_AUDIT_SPEC)
_AUDIT_SPEC.loader.exec_module(_audit)
BOOK_BY_NAME = _audit.BOOK_BY_NAME
fetch_neo = _audit.fetch_neo
norm_name = _audit.norm_name
norm_text = _audit.norm_text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = PROJECT_ROOT / "public" / "data" / "interlinear"
DEFAULT_PROGRESS = DATA_ROOT / "_audit" / "20260923T123001Z" / "progress.jsonl"
TESTAMENT_OF = {"hebrew": "AT", "greek": "NT"}


def find_book_file(book: str) -> tuple[str, Path] | tuple[None, None]:
    for test in ("hebrew", "greek"):
        for fn in sorted(glob.glob(str(DATA_ROOT / test / "*.json"))):
            if os.path.basename(fn).replace(".json", "") == book:
                return test, Path(fn)
    return None, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--delay", type=float, default=2.0)
    ap.add_argument("--progress", default=str(DEFAULT_PROGRESS))
    args = ap.parse_args()

    missing = []
    for line in open(args.progress, encoding="utf-8"):
        d = json.loads(line)
        if d.get("status") == "missing_local":
            missing.append(d)
    print(f"versos faltantes: {len(missing)}")

    # indice shortname remoto -> url base ya conocida por libro
    added = 0
    for m in missing:
        key = m["key"]  # "Ex 23:30"
        short, cv = key.split(" ", 1)
        ch, vs = cv.split(":")
        book = m.get("book")
        test, path = find_book_file(book)
        if path is None:
            print("  SIN FICHERO:", key)
            continue
        tpath = TESTAMENT_OF[test]
        url = f"https://logosklogos.com/{tpath}/{short}/{ch}/{vs}"
        state = fetch_neo(url, 30, 4)
        if not state:
            print("  FALLO FETCH:", key)
            continue
        try:
            iv = state["data"]["interlinearVerse"]
            rwords = iv["words"]
            fullname = iv["verse"]["book"]["fullname"]
        except (KeyError, TypeError):
            print("  RESPUESTA RARA:", key)
            continue
        if BOOK_BY_NAME.get(norm_name(fullname)) != book:
            print(f"  LIBRO DISTINTO en {key}: {fullname}")
            continue
        field = "hebrew" if test == "hebrew" else "greek"
        words = []
        for rw in rwords:
            words.append({
                field: norm_text(rw.get("manuscriptText")),
                "parsing": norm_text(rw.get("parsingCode")).lower(),
                "strong": str(rw.get("strongNumber")),
                "spanish": norm_text(rw.get("gloss")),
                "lemma": norm_text(rw.get("lemma")),
                "parsingCode": norm_text(rw.get("parsingCode")),
            })
        if args.apply:
            entries = json.loads(path.read_text(encoding="utf-8"))
            if any(int(e.get("chapter", -1)) == int(ch)
                   and int(e.get("verse", -1)) == int(vs) for e in entries):
                print(f"  ya existe (omitido): {key}")
                continue
            entries.append({"chapter": int(ch), "verse": int(vs), "words": words})
            entries.sort(key=lambda e: (int(e.get("chapter", 0)), int(e.get("verse", 0))))
            path.write_text(json.dumps(entries, ensure_ascii=False, indent=2),
                            encoding="utf-8")
            added += 1
            print(f"  + {key} ({len(words)} palabras)")
        else:
            print(f"  ~ {key} ({len(words)} palabras) [dry-run]")
        time.sleep(args.delay + random.uniform(0, 0.5))
    print(f"agregados={added} apply={args.apply}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
