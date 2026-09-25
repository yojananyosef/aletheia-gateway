"""
Backfill de `lemma` + `parsingCode` para versiculos que no los tienen.

Fuentes, en orden:
  1. remote-words.jsonl de la auditoria (sin red): para cada verso local con
     palabras sin lemma, si la key existe en la captura, se rellenan por
     posicion verificando el strong.
  2. Red (1 hilo, con delay): solo hebreo pre-captura. Reanudable: salta lo
     ya relleno. Guarda cada N libros.

Uso:
  python3 scripts/backfill-hebrew-lemma.py --capture P [--apply] [--network]
  Sin --network solo hace la fase 1 (captura). Sin --apply, dry-run.
"""

from __future__ import annotations

import argparse
import glob
import importlib.util
import json
import os
import random
import time
from pathlib import Path

_AUDIT_SPEC = importlib.util.spec_from_file_location(
    "audit_interlinear",
    str(Path(__file__).resolve().parent / "audit-interlinear.py"))
_audit = importlib.util.module_from_spec(_AUDIT_SPEC)
_AUDIT_SPEC.loader.exec_module(_audit)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = PROJECT_ROOT / "public" / "data" / "interlinear"
DEFAULT_CAPTURE = DATA_ROOT / "_audit" / "20260923T123001Z" / "remote-words.jsonl"

# short LogosKLogos -> BOOK gateway (66 libros, deducido del barrido completo)
SHORT2BOOK = {
    "Gn": "GEN", "Ex": "EXO", "Lv": "LEV", "Nm": "NUM", "Dt": "DEU",
    "Jos": "JOS", "Jue": "JDG", "Rt": "RUT", "1S": "1SA", "2S": "2SA",
    "1R": "1KI", "2R": "2KI", "1Cr": "1CH", "2Cr": "2CH", "Esd": "EZR",
    "Neh": "NEH", "Est": "EST", "Job": "JOB", "Sal": "PSA", "Pr": "PRO",
    "Ec": "ECC", "Cnt": "SNG", "Is": "ISA", "Jer": "JER", "Lm": "LAM",
    "Ez": "EZK", "Dn": "DAN", "Os": "HOS", "Jl": "JOL", "Am": "AMO",
    "Abd": "OBA", "Jon": "JON", "Mi": "MIC", "Nah": "NAM", "Hab": "HAB",
    "Sof": "ZEP", "Ha": "HAG", "Zac": "ZEC", "Mal": "MAL",
    "Mt": "MAT", "Mr": "MRK", "Lc": "LUK", "Jn": "JHN", "Hch": "ACT",
    "Ro": "ROM", "1Co": "1CO", "2Co": "2CO", "Ga": "GAL", "Ef": "EPH",
    "Fil": "PHP", "Col": "COL", "1Ts": "1TH", "2Ts": "2TH", "1Ti": "1TI",
    "2Ti": "2TI", "Tit": "TIT", "Flm": "PHM", "He": "HEB", "Stg": "JAS",
    "1P": "1PE", "2P": "2PE", "1Jn": "1JN", "2Jn": "2JN", "3Jn": "3JN",
    "Jud": "JUD", "Ap": "REV",
}


def load_local(test: str) -> dict[str, tuple[Path, list]]:
    out = {}
    for fn in sorted(glob.glob(str(DATA_ROOT / test / "*.json"))):
        book = os.path.basename(fn).replace(".json", "")
        out[book] = (Path(fn), json.loads(Path(fn).read_text(encoding="utf-8")))
    return out


def needs_fill(words: list) -> bool:
    return any(not w.get("lemma") or not w.get("parsingCode") for w in words)


def fill_from_remote(words: list, rwords: list) -> tuple[int, int]:
    """Rellena por posicion verificando strong. Retorna (ok, conflictos)."""
    ok = conf = 0
    if len(words) != len(rwords):
        return 0, len(words)
    for w, rw in zip(words, rwords):
        rs = str(rw.get("strongNumber"))
        if str(w.get("strong", "")).strip() != rs:
            conf += 1
            continue
        if not w.get("lemma") and rw.get("lemma"):
            w["lemma"] = rw["lemma"]
            ok += 1
        if not w.get("parsingCode") and rw.get("parsingCode"):
            w["parsingCode"] = rw["parsingCode"]
            ok += 1
    return ok, conf


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--capture", default=str(DEFAULT_CAPTURE))
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--network", action="store_true")
    ap.add_argument("--delay", type=float, default=2.0)
    args = ap.parse_args()

    cap: dict[str, list] = {}
    if os.path.isfile(args.capture):
        for line in open(args.capture, encoding="utf-8"):
            d = json.loads(line)
            cap[d["key"]] = d["words"]
    print(f"captura: {len(cap)} versos")

    hebrew = load_local("hebrew")
    greek = load_local("greek")

    # short remoto -> BOOK gateway: tabla fija (progress solo trae `book`
    # en lineas diff/missing, insuficiente para los 66 libros)
    prog = DATA_ROOT / "_audit" / "20260923T123001Z" / "progress.jsonl"
    short2book: dict[str, str] = dict(SHORT2BOOK)
    for line in open(prog, encoding="utf-8"):
        d = json.loads(line)
        if d.get("status") in ("ok", "diff") and d.get("book"):
            try:
                short2book.setdefault(d["key"].split(" ", 1)[0], d["book"])
            except IndexError:
                pass
    book2short = {b: s for s, b in short2book.items()}

    filled = conf = 0
    pending_fetch: list[tuple[str, str, int, int]] = []  # (book, short, ch, v)

    for test, books in (("hebrew", hebrew), ("greek", greek)):
        for book, (path, entries) in books.items():
            short = book2short.get(book)
            dirty = False
            for e in entries:
                words = e.get("words") or []
                if not needs_fill(words):
                    continue
                key = f"{short} {e.get('chapter')}:{e.get('verse')}" if short else None
                rwords = cap.get(key) if key else None
                if rwords is not None:
                    if args.apply:
                        o, c = fill_from_remote(words, rwords)
                        filled += o
                        conf += c
                        dirty = dirty or o > 0
                    else:
                        filled += sum(1 for w in words if not w.get("lemma"))
                else:
                    pending_fetch.append((book, short, int(e["chapter"]), int(e["verse"])))
            if args.apply and dirty:
                path.write_text(json.dumps(entries, ensure_ascii=False, indent=2),
                                encoding="utf-8")
    print(f"fase1: palabras rellenables={filled} conflictos={conf} apply={args.apply}")
    print(f"pendientes de red: {len(pending_fetch)}")

    if args.network and args.apply and pending_fetch:
        # mapa short: deducir faltantes via progress (book conocido)
        prog = DATA_ROOT / "_audit" / "20260923T123001Z" / "progress.jsonl"
        for line in open(prog, encoding="utf-8"):
            d = json.loads(line)
            if d.get("status") in ("ok", "diff") and d.get("book"):
                try:
                    short2book.setdefault(d["key"].split(" ", 1)[0], d["book"])
                except IndexError:
                    pass
        book2short = {b: s for s, b in short2book.items()}
        test_of = {}
        for test, books in (("hebrew", hebrew), ("greek", greek)):
            for b in books:
                test_of[b] = test
        done_books = set()
        for i, (book, _short, ch, vs) in enumerate(pending_fetch):
            short = book2short.get(book)
            if not short:
                print("  SIN SHORT:", book, ch, vs)
                continue
            tpath = "AT" if test_of[book] == "hebrew" else "NT"
            url = f"https://logosklogos.com/{tpath}/{short}/{ch}/{vs}"
            state = _audit.fetch_neo(url, 30, 4)
            if not state:
                print(f"  FALLO ({i}/{len(pending_fetch)}): {book} {ch}:{vs}")
                continue
            try:
                rwords = state["data"]["interlinearVerse"]["words"]
            except (KeyError, TypeError):
                continue
            _path, entries = hebrew.get(book, (None, None)) or greek.get(book, (None, None))
            e = next((x for x in entries
                      if int(x.get("chapter", -1)) == ch and int(x.get("verse", -1)) == vs), None)
            if e is None:
                continue
            o, c = fill_from_remote(e.get("words") or [], rwords)
            filled += o
            conf += c
            if book not in done_books:
                pass
            # guardar cada 200 versos
            if i % 200 == 0:
                for _b, (_p, _e) in {**hebrew, **greek}.items():
                    _p.write_text(json.dumps(_e, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"  ... {i}/{len(pending_fetch)} (guardado)")
            time.sleep(args.delay + random.uniform(0, 0.5))
        for _p, _e in [v for v in {**hebrew, **greek}.values()]:
            _p.write_text(json.dumps(_e, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"fase2 fin: rellenos={filled} conflictos={conf}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
