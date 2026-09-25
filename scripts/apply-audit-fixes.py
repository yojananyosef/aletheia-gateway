"""
Aplica las correcciones de la auditoria 1-a-1 al interlineal local.

Regla: la glosa/strong/texto local pasa a valer lo remoto, verso por verso.
Es autocorrectivo: tanto los diffs pre-fix (local='vocero') como los
post-fix (local='profeta' donde el remoto dice 'vocero') quedan alineados,
porque siempre se impone el valor remoto del registro de auditoria.

Seguridades por palabra:
  - el conteo de palabras debe coincidir (siempre coincide segun auditoria)
  - el strong local debe coincidir con el del registro (o ya estar corregido)
  - si la palabra local ya vale lo remoto -> no-op
  - si la palabra local no coincide ni con `local` ni con `remote` -> conflicto

Uso:
  python3 scripts/apply-audit-fixes.py [--apply] [--progress P] [--only-book BOOK]
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = PROJECT_ROOT / "public" / "data" / "interlinear"
DEFAULT_PROGRESS = DATA_ROOT / "_audit" / "20260923T123001Z" / "progress.jsonl"


def book_file(book: str) -> Path | None:
    for test in ("hebrew", "greek"):
        for fn in glob.glob(str(DATA_ROOT / test / "*.json")):
            if os.path.basename(fn).replace(".json", "") == book:
                return Path(fn)
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--progress", default=str(DEFAULT_PROGRESS))
    ap.add_argument("--only-book", default=None)
    args = ap.parse_args()

    diffs = []
    for line in open(args.progress, encoding="utf-8"):
        d = json.loads(line)
        if d.get("status") != "diff":
            continue
        if args.only_book and d.get("book") != args.only_book.upper():
            continue
        diffs.append(d)

    cache: dict[str, list] = {}
    applied = noop = conflicts = 0
    conflict_list: list[dict] = []

    for d in diffs:
        book = d["book"]
        if book not in cache:
            path = book_file(book)
            cache[book] = (path, json.loads(path.read_text(encoding="utf-8")) if path else None)
        path, entries = cache[book]
        if entries is None:
            conflicts += 1
            conflict_list.append({"key": d["key"], "reason": "sin fichero local"})
            continue
        entry = None
        # la key es "SHORT c:v"; reconstruir capitulo/versiculo
        try:
            cv = d["key"].split(" ", 1)[1]
            ch, vs = (int(x) for x in cv.split(":"))
        except (IndexError, ValueError):
            conflicts += 1
            conflict_list.append({"key": d["key"], "reason": "key ilegible"})
            continue
        entry = next((e for e in entries
                      if int(e.get("chapter", -1)) == ch and int(e.get("verse", -1)) == vs), None)
        if entry is None:
            conflicts += 1
            conflict_list.append({"key": d["key"], "reason": "verso no existe local"})
            continue
        words = entry.get("words") or []
        if len(words) != d.get("local_count", len(words)):
            conflicts += 1
            conflict_list.append({"key": d["key"], "reason": "conteo cambio desde auditoria"})
            continue
        dirty = False
        for x in d.get("diffs", []):
            t = x.get("type")
            if t == "truncated":
                continue
            pos = x.get("pos")
            if pos is None or not (0 <= pos < len(words)):
                conflicts += 1
                conflict_list.append({"key": d["key"], "reason": f"pos {pos} fuera de rango"})
                continue
            w = words[pos]
            if t == "gloss":
                cur = w.get("spanish", "")
                if cur == x["remote"]:
                    noop += 1
                elif cur == x["local"]:
                    if args.apply:
                        w["spanish"] = x["remote"]
                        dirty = True
                    applied += 1
                else:
                    conflicts += 1
                    conflict_list.append({"key": d["key"],
                                          "reason": f"glosa cambio: {cur!r} vs audit {x['local']!r}"})
            elif t == "strong":
                cur = str(w.get("strong", "")).strip()
                if str(x["remote"]) == cur:
                    noop += 1
                elif str(x.get("local")) == cur or x.get("local") is None:
                    if args.apply:
                        w["strong"] = str(x["remote"])
                        dirty = True
                    applied += 1
                else:
                    conflicts += 1
                    conflict_list.append({"key": d["key"], "reason": f"strong cambio: {cur!r}"})
            elif t == "text":
                field = "hebrew" if "hebrew" in w or "hebrew_aramaic" in w else "greek"
                if field == "hebrew" and "hebrew" not in w:
                    field = "hebrew_aramaic"
                cur = w.get(field, "")
                if cur == x["remote"]:
                    noop += 1
                elif cur == x["local"]:
                    if args.apply:
                        w[field] = x["remote"]
                        dirty = True
                    applied += 1
                else:
                    conflicts += 1
                    conflict_list.append({"key": d["key"], "reason": f"texto cambio: {cur!r}"})
            elif t == "gloss_case":
                noop += 1  # solo mayusculas: no se toca
            elif t == "word_count":
                conflicts += 1
                conflict_list.append({"key": d["key"], "reason": "word_count requiere revision manual"})
        if args.apply and dirty:
            path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"versos-diff={len(diffs)} aplicados={applied} noop={noop} conflictos={conflicts}")
    for c in conflict_list[:30]:
        print("  CONFLICTO:", c)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
