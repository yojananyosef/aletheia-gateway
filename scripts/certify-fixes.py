"""
Certificacion: re-audita solo los versiculos tocados por el parche
(150 diff + 70 missing rellenados; Sal 47:10 se verifica ausente por ser
versiculo fantasma) contra el remoto, con los datos locales ACTUALES.

Exito = cero diffs. Corre en ~10-15 min, 1 hilo.

Uso:
  nohup python3 -u scripts/certify-fixes.py > .../certify.log 2>&1 &
"""

from __future__ import annotations

import glob
import importlib.util
import json
import os
import random
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load_mod(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, str(HERE / filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_audit = load_mod("audit_interlinear", "audit-interlinear.py")
_backfill = load_mod("backfill_hebrew_lemma", "backfill-hebrew-lemma.py")

PROJECT_ROOT = HERE.parents[0]
DATA_ROOT = PROJECT_ROOT / "public" / "data" / "interlinear"
PROGRESS = DATA_ROOT / "_audit" / "20260923T123001Z" / "progress.jsonl"
BOOK2SHORT = {b: s for s, b in _backfill.SHORT2BOOK.items()}

TESTAMENT_BOOKS = set()
for _t in ("hebrew", "greek"):
    for _fn in glob.glob(str(DATA_ROOT / _t / "*.json")):
        TESTAMENT_BOOKS.add(os.path.basename(_fn).replace(".json", ""))


def load_book(book: str) -> tuple[str, dict]:
    for test in ("hebrew", "greek"):
        path = DATA_ROOT / test / f"{book}.json"
        if path.is_file():
            entries = json.loads(path.read_text(encoding="utf-8"))
            idx = {}
            for e in entries:
                try:
                    idx[(int(e["chapter"]), int(e["verse"]))] = e.get("words") or []
                except (KeyError, TypeError, ValueError):
                    continue
            return test, idx
    raise FileNotFoundError(book)


def book_testament(book: str) -> str:
    return "hebrew" if (DATA_ROOT / "hebrew" / f"{book}.json").is_file() else "greek"


def main() -> int:
    targets: list[dict] = []
    for line in open(PROGRESS, encoding="utf-8"):
        d = json.loads(line)
        if d.get("status") == "diff":
            targets.append({"key": d["key"], "book": d["book"], "kind": "diff"})
        elif d.get("status") == "missing_local" and d["key"] != "Sal 47:10":
            targets.append({"key": d["key"], "book": d.get("book"), "kind": "missing"})
    print(f"versos a certificar: {len(targets)}", flush=True)

    cache: dict[str, tuple[str, dict]] = {}
    passed = failed = 0
    failures: list[dict] = []
    for i, t in enumerate(targets):
        book = t["book"]
        short, cv = t["key"].split(" ", 1)
        ch, vs = (int(x) for x in cv.split(":"))
        if book not in cache:
            cache[book] = (book_testament(book),
                           load_book(book)[1])
        test, idx = cache[book]
        local_words = idx.get((ch, vs))
        if local_words is None:
            failed += 1
            failures.append({"key": t["key"], "reason": "no existe en local"})
            continue
        tpath = "AT" if test == "hebrew" else "NT"
        url = f"https://logosklogos.com/{tpath}/{short}/{ch}/{vs}"
        state = _audit.fetch_neo(url, 30, 4)
        if not state:
            failed += 1
            failures.append({"key": t["key"], "reason": "fetch_error"})
            continue
        try:
            rwords = state["data"]["interlinearVerse"]["words"]
        except (KeyError, TypeError):
            failed += 1
            failures.append({"key": t["key"], "reason": "respuesta rara"})
            continue
        diffs = _audit.compare_words(local_words, rwords, test)
        if diffs:
            failed += 1
            failures.append({"key": t["key"], "diffs": diffs})
        else:
            passed += 1
        if (i + 1) % 25 == 0:
            print(f"... {i + 1}/{len(targets)} ok={passed} fail={failed}", flush=True)
        time.sleep(2.0 + random.uniform(0, 0.5))

    print(f"CERTIFICACION: total={len(targets)} passed={passed} failed={failed}")
    for f in failures:
        print("  FALLO:", json.dumps(f, ensure_ascii=False)[:300])
    (DATA_ROOT / "_audit" / "certify-result.json").write_text(
        json.dumps({"passed": passed, "failed": failed, "failures": failures},
                   ensure_ascii=False, indent=2), encoding="utf-8")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
