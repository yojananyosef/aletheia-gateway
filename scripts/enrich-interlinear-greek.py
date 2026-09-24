"""
Enriquece el interlineal griego local con `lemma` + `parsingCode` desde
Tischendorf 8a ed. (morphgnt/tischendorf-data, Dominio Publico).

Solo toca versiculos con alineacion 1-a-1 verificada (mismo conteo de
palabras Y misma secuencia de Strong). El resto se reporta y no se toca;
la auditoria de red los valida por separado.

Uso:
  python3 scripts/enrich-interlinear-greek.py [--apply]
Sin --apply solo reporta.
"""

from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
TDIR = Path("/tmp/bibsrc/tischendorf-data/word-per-line/2.7/Unicode/")
GREEK_DIR = PROJECT_ROOT / "public" / "data" / "interlinear" / "greek"
REPORT = PROJECT_ROOT / "public" / "data" / "interlinear" / "_audit" / "greek-enrich-report.json"

TMAP = {"MT": "MAT", "MR": "MRK", "LU": "LUK", "JOH": "JHN", "AC": "ACT",
        "RO": "ROM", "GA": "GAL", "RE": "REV", "JUDE": "JUD",
        "1JO": "1JN", "2JO": "2JN", "3JO": "3JN"}


def parse_tisch(fn: Path) -> dict:
    out: dict[tuple[int, int], list[dict]] = {}
    for line in fn.open(encoding="utf-8"):
        p = line.rstrip("\n").split(" ")
        if len(p) < 10:
            continue
        ch, rest = p[1].split(":")
        v = rest.split(".")[0]
        out.setdefault((int(ch), int(v)), []).append(
            {"surface": p[3], "parse": p[5], "strong": p[6], "lemma": p[7]})
    return out


def main() -> int:
    apply = "--apply" in sys.argv
    total = ok = 0
    skipped: list[dict] = []
    enriched_books = 0
    for fn in sorted(glob.glob(str(TDIR / "*.txt"))):
        ab = os.path.basename(fn).replace(".txt", "")
        gw = TMAP.get(ab, ab)
        t = parse_tisch(Path(fn))
        path = GREEK_DIR / f"{gw}.json"
        entries = json.loads(path.read_text(encoding="utf-8"))
        loc = {(e["chapter"], e["verse"]): e for e in entries}
        dirty = False
        for key, tw in t.items():
            total += 1
            e = loc.get(key)
            if e is None:
                skipped.append({"book": gw, "verse": key, "reason": "FALTA-LOCAL"})
                continue
            lw = e.get("words") or []
            if len(lw) != len(tw):
                skipped.append({"book": gw, "verse": key,
                                "reason": f"count local={len(lw)} tisch={len(tw)}"})
                continue
            if not all(str(w.get("strong", "")).strip() == str(x["strong"])
                       for w, x in zip(lw, tw)):
                skipped.append({"book": gw, "verse": key, "reason": "strong-seq"})
                continue
            ok += 1
            if apply:
                for w, x in zip(lw, tw):
                    w["lemma"] = x["lemma"]
                    w["parsingCode"] = x["parse"]
                dirty = True
        if apply and dirty:
            path.write_text(json.dumps(entries, ensure_ascii=False, indent=2),
                            encoding="utf-8")
            enriched_books += 1
    print(f"TOTAL={total} OK={ok} SKIPPED={len(skipped)} apply={apply}")
    for s in skipped[:40]:
        print("  ", s)
    if apply:
        REPORT.write_text(json.dumps({"ok": ok, "skipped": skipped},
                                     ensure_ascii=False, indent=1),
                          encoding="utf-8")
        print(f"libros actualizados: {enriched_books}, reporte: {REPORT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
