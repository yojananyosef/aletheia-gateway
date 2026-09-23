"""
Auditoría 1-a-1 del interlineal gateway contra LogosKLogos (verdad de referencia).

Recorre cada versículo (AT desde /AT/Gn/1/1 y NT desde /NT/Mt/1/1 siguiendo
los enlaces `next` del estado embebido) y compara con
public/data/interlinear/{hebrew,greek}/{BOOK}.json palabra por palabra:
  - número de palabras (omisiones / fusiones)
  - texto manuscrito (hebreo/griego, sin espacios de más)
  - número Strong (numérico)
  - glosa en español (insensible a mayúsculas; la diferencia solo de
    mayúscula se reporta aparte)
  - parsing: hebreo NRVA `parsing` <-> `parsingCode` (insensible a
    mayúsculas); griego NRVA `parsing` <-> `morphology` (exacto)

Cortesía con el servidor:
  - 1 hilo, --delay segundos entre peticiones (+jitter), User-Agent propio
  - backoff exponencial ante 429/5xx, reintentos limitados
  - progreso reanudable en --progress (JSONL de resultados), --max-verses
    y --only-book para ejecuciones parciales

Uso:
  python scripts/audit-interlinear.py [--delay 2.0] [--max-verses 200]
  python scripts/audit-interlinear.py --resume  # continúa donde quedó

Salida:
  - public/data/interlinear/_audit/<timestamp>/report.json (resumen)
  - public/data/interlinear/_audit/<timestamp>/diffs.jsonl (versículos con diferencias)
"""

from __future__ import annotations

import argparse
import html as htmlmod
import json
import random
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = PROJECT_ROOT / "public" / "data" / "interlinear"
AUDIT_ROOT = DATA_ROOT / "_audit"

BASE_URL = "https://logosklogos.com"
START_URLS = [f"{BASE_URL}/AT/Gn/1/1", f"{BASE_URL}/NT/Mt/1/1"]
USER_AGENT = "AletheiaGateway-audit/0.14 (+auditoria local, 1 hilo)"

NEO_RE = re.compile(
    r'<script type="application/json" id="__NEO_STATE__">(.*?)</script>', re.S
)


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def norm_name(s: str) -> str:
    return strip_accents(s).lower().replace(" ", "")


# Nombre normalizado (gateway) -> código BOOK. Se completa con alias comunes.
BOOK_BY_NAME = {
    "genesis": "GEN", "exodo": "EXO", "levitico": "LEV", "numeros": "NUM",
    "deuteronomio": "DEU", "josue": "JOS", "jueces": "JDG", "rut": "RUT",
    "1samuel": "1SA", "2samuel": "2SA", "1reyes": "1KI", "2reyes": "2KI",
    "1cronicas": "1CH", "2cronicas": "2CH", "esdras": "EZR", "nehemias": "NEH",
    "ester": "EST", "job": "JOB", "salmos": "PSA", "proverbios": "PRO",
    "eclesiastes": "ECC", "cantares": "SNG", "isaias": "ISA", "jeremias": "JER",
    "lamentaciones": "LAM", "ezequiel": "EZK", "daniel": "DAN", "oseas": "HOS",
    "joel": "JOL", "amos": "AMO", "abdias": "OBA", "jonas": "JON",
    "miqueas": "MIC", "nahum": "NAM", "habacuc": "HAB", "sofonias": "ZEP",
    "hageo": "HAG", "zacarias": "ZEC", "malaquias": "MAL", "mateo": "MAT",
    "marcos": "MRK", "lucas": "LUK", "juan": "JHN", "hechos": "ACT",
    "romanos": "ROM", "1corintios": "1CO", "2corintios": "2CO", "galatas": "GAL",
    "efesios": "EPH", "filipenses": "PHP", "colosenses": "COL",
    "1tesalonicenses": "1TH", "2tesalonicenses": "2TH", "1timoteo": "1TI",
    "2timoteo": "2TI", "tito": "TIT", "filemon": "PHM", "hebreos": "HEB",
    "santiago": "JAS", "1pedro": "1PE", "2pedro": "2PE", "1juan": "1JN",
    "2juan": "2JN", "3juan": "3JN", "judas": "JUD", "apocalipsis": "REV",
}


def load_local() -> dict[tuple[str, int, int], list[dict]]:
    """{(BOOK, cap, vers): [palabras]} desde los 66 JSON gateway."""
    local: dict[tuple[str, int, int], list[dict]] = {}
    for testament in ("hebrew", "greek"):
        for path in sorted((DATA_ROOT / testament).glob("*.json")):
            book = path.stem
            try:
                entries = json.loads(path.read_text(encoding="utf-8"))
            except Exception as exc:
                print(f"AVISO: no se pudo leer {path}: {exc}", file=sys.stderr)
                continue
            for entry in entries:
                try:
                    key = (book, int(entry["chapter"]), int(entry["verse"]))
                except (KeyError, TypeError, ValueError):
                    continue
                local[key] = entry.get("words") or []
    return local


def fetch_neo(url: str, timeout: int, max_retries: int) -> dict | None:
    backoff = 5.0
    for attempt in range(max_retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                html_text = resp.read().decode("utf-8")
            match = NEO_RE.search(html_text)
            if not match:
                return None
            return json.loads(htmlmod.unescape(match.group(1)))
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503) and attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2
                continue
            print(f"AVISO: HTTP {exc.code} en {url}", file=sys.stderr)
            return None
        except Exception as exc:
            if attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2
                continue
            print(f"AVISO: fallo en {url}: {exc}", file=sys.stderr)
            return None
    return None


def norm_text(s: object) -> str:
    return str(s or "").strip()


def compare_words(
    local_words: list[dict], remote_words: list[dict], testament: str
) -> list[dict]:
    diffs: list[dict] = []
    if len(local_words) != len(remote_words):
        diffs.append(
            {
                "type": "word_count",
                "local": len(local_words),
                "remote": len(remote_words),
            }
        )
    for i, (lw, rw) in enumerate(zip(local_words, remote_words)):
        field = "hebrew" if testament == "hebrew" else "greek"
        local_text = norm_text(lw.get(field) or lw.get("hebrew_aramaic"))
        remote_text = norm_text(rw.get("manuscriptText"))
        if local_text != remote_text:
            diffs.append(
                {"type": "text", "pos": i, "local": local_text, "remote": remote_text}
            )
        try:
            local_strong = int(str(lw.get("strong", "")).strip())
        except ValueError:
            local_strong = None
        if local_strong != rw.get("strongNumber"):
            diffs.append(
                {
                    "type": "strong",
                    "pos": i,
                    "local": local_strong,
                    "remote": rw.get("strongNumber"),
                }
            )
        local_gloss = norm_text(lw.get("spanish"))
        remote_gloss = norm_text(rw.get("gloss"))
        if local_gloss != remote_gloss:
            diffs.append(
                {
                    "type": "gloss_case" if local_gloss.lower() == remote_gloss.lower() else "gloss",
                    "pos": i,
                    "local": local_gloss,
                    "remote": remote_gloss,
                }
            )
        local_parsing = norm_text(lw.get("parsing"))
        if testament == "hebrew":
            remote_parsing = norm_text(rw.get("parsingCode"))
            if local_parsing.lower() != remote_parsing.lower():
                diffs.append(
                    {
                        "type": "parsing",
                        "pos": i,
                        "local": local_parsing,
                        "remote": remote_parsing,
                    }
                )
        else:
            remote_morph = norm_text(rw.get("morphology"))
            if local_parsing != remote_morph:
                diffs.append(
                    {
                        "type": "parsing",
                        "pos": i,
                        "local": local_parsing,
                        "remote": remote_morph,
                    }
                )
        if len(diffs) > 12:
            diffs.append({"type": "truncated"})
            break
    return diffs


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita el interlineal contra LogosKLogos.")
    parser.add_argument("--delay", type=float, default=2.0)
    parser.add_argument("--jitter", type=float, default=0.5)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--max-retries", type=int, default=4)
    parser.add_argument("--max-verses", type=int, default=0)
    parser.add_argument("--only-book", default=None, help="Solo un BOOK gateway (ej. GEN)")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--progress", default=None)
    parser.add_argument("--start-url", default=None,
                        help="URL LogosKLogos desde donde continuar (ej. .../AT/Ex/34/4). "
                             "Evita re-descargar lo ya auditado al reanudar.")
    args = parser.parse_args()

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_dir = AUDIT_ROOT / stamp
    progress_path = Path(args.progress) if args.progress else run_dir / "progress.jsonl"
    run_dir.mkdir(parents=True, exist_ok=True)

    print("Cargando datos locales...")
    local = load_local()
    print(f"Versículos locales: {len(local)}")

    done: set[str] = set()
    if args.resume and progress_path.is_file():
        with open(progress_path, encoding="utf-8") as f:
            for line in f:
                try:
                    done.add(json.loads(line)["key"])
                except (KeyError, json.JSONDecodeError):
                    continue
        print(f"Reanudando: {len(done)} versículos ya auditados.")

    out = open(progress_path, "a" if args.resume else "w", encoding="utf-8", buffering=1)

    stats = {"ok": 0, "diff": 0, "missing_local": 0, "fetch_error": 0, "unmapped_book": 0}
    diff_count = 0
    checked = 0

    # Inicio rápido: si se indica --start-url se continúa desde ahí en vez de
    # recorrer desde Gn 1:1 / Mt 1:1 (el --resume antiguo re-descargaba todo
    # lo ya auditado solo para saltarlo). Si el arranque es del AT, después
    # se recorre el NT completo; si es del NT, el AT ya está completo.
    starts = list(START_URLS)
    if args.start_url:
        if "/NT/" in args.start_url:
            starts = [args.start_url]
        else:
            starts = [args.start_url, START_URLS[1]]
        print(f"Inicio rápido desde: {args.start_url}")

    try:
        for start in starts:
            url: str | None = start
            while url:
                if args.max_verses and checked >= args.max_verses:
                    url = None
                    break
                state = fetch_neo(url, args.timeout, args.max_retries)
                if not state:
                    stats["fetch_error"] += 1
                    out.write(json.dumps({"key": url, "status": "fetch_error"}) + "\n")
                    break
                try:
                    iv = state["data"]["interlinearVerse"]
                    book = iv["verse"]["book"]
                    chapter = int(iv["verse"]["chapter"])
                    verse_num = int(iv["verse"]["number"])
                    short = book["shortname"]
                    fullname = book["fullname"]
                    words = iv["words"]
                    nxt = iv.get("next")
                except (KeyError, TypeError, ValueError):
                    stats["fetch_error"] += 1
                    break

                key = f"{short} {chapter}:{verse_num}"
                book_code = BOOK_BY_NAME.get(norm_name(fullname))
                if not book_code:
                    stats["unmapped_book"] += 1
                    out.write(json.dumps({"key": key, "status": "unmapped_book",
                                          "fullname": fullname}) + "\n")
                elif args.only_book and book_code != args.only_book.upper():
                    pass
                elif key in done:
                    pass
                else:
                    local_words = local.get((book_code, chapter, verse_num))
                    if local_words is None:
                        stats["missing_local"] += 1
                        out.write(json.dumps({"key": key, "status": "missing_local",
                                              "book": book_code}) + "\n")
                    else:
                        testament = "hebrew" if book_code in {
                            b for b, (t, _f) in _book_testaments().items() if t == "hebrew"
                        } else "greek"
                        diffs = compare_words(local_words, words, testament)
                        if diffs:
                            stats["diff"] += 1
                            diff_count += 1
                            out.write(json.dumps({
                                "key": key, "status": "diff", "book": book_code,
                                "local_count": len(local_words),
                                "remote_count": len(words), "diffs": diffs,
                            }, ensure_ascii=False) + "\n")
                        else:
                            stats["ok"] += 1
                            out.write(json.dumps({"key": key, "status": "ok"}) + "\n")
                    checked += 1
                    if checked % 100 == 0:
                        out.flush()
                        print(f"... {checked} auditados "
                              f"(ok={stats['ok']} diff={stats['diff']} "
                              f"missing={stats['missing_local']} err={stats['fetch_error']})")

                if nxt and isinstance(nxt, dict) and nxt.get("book", {}).get("shortname"):
                    test = "NT" if start.startswith(f"{BASE_URL}/NT") else "AT"
                    book_short = nxt["book"]["shortname"]
                    url = f"{BASE_URL}/{test}/{book_short}/{nxt['chapter']}/{nxt['number']}"
                else:
                    url = None

                time.sleep(args.delay + random.uniform(0, args.jitter))
    finally:
        out.close()

    report = {
        "started_at": stamp,
        "checked": checked,
        "stats": stats,
        "progress": str(progress_path),
    }
    (run_dir / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


def _book_testaments() -> dict[str, tuple[str, str]]:
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "conv", str(PROJECT_ROOT / "scripts" / "convert-interlinear.py")
    )
    if spec is None or spec.loader is None:
        return {}
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.BOOK_FILES


if __name__ == "__main__":
    raise SystemExit(main())
