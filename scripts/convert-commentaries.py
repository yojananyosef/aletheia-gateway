"""
Convierte los módulos Sword de comentarios ubicados en:
C:/Users/J/Desktop/Versiones/otros/otros/comentaries

Salida:
public/data/commentaries/<id>.json

Los módulos zCom se leen con ZTextModule y el módulo RawCom con
RawTextModule. El texto se guarda por libro, capítulo y versículo, listo para
ser consultado bajo demanda por la aplicación.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import struct
import sys
import zlib
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup
from pysword.bible import BlockType, CompressType, RawTextModule, ZTextModule


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"C:\Users\J\Desktop\Versiones\otros\otros\comentaries")
OUTPUT_ROOT = PROJECT_ROOT / "public" / "data" / "commentaries"


BOOKS = {
    "Genesis": ("GEN", "Génesis"),
    "Exodus": ("EXO", "Éxodo"),
    "Leviticus": ("LEV", "Levítico"),
    "Numbers": ("NUM", "Números"),
    "Deuteronomy": ("DEU", "Deuteronomio"),
    "Joshua": ("JOS", "Josué"),
    "Judges": ("JDG", "Jueces"),
    "Ruth": ("RUT", "Rut"),
    "I Samuel": ("1SA", "1 Samuel"),
    "II Samuel": ("2SA", "2 Samuel"),
    "I Kings": ("1KI", "1 Reyes"),
    "II Kings": ("2KI", "2 Reyes"),
    "I Chronicles": ("1CH", "1 Crónicas"),
    "II Chronicles": ("2CH", "2 Crónicas"),
    "Ezra": ("EZR", "Esdras"),
    "Nehemiah": ("NEH", "Nehemías"),
    "Esther": ("EST", "Ester"),
    "Job": ("JOB", "Job"),
    "Psalms": ("PSA", "Salmos"),
    "Proverbs": ("PRO", "Proverbios"),
    "Ecclesiastes": ("ECC", "Eclesiastés"),
    "Song of Solomon": ("SNG", "Cantares"),
    "Isaiah": ("ISA", "Isaías"),
    "Jeremiah": ("JER", "Jeremías"),
    "Lamentations": ("LAM", "Lamentaciones"),
    "Ezekiel": ("EZK", "Ezequiel"),
    "Daniel": ("DAN", "Daniel"),
    "Hosea": ("HOS", "Oseas"),
    "Joel": ("JOL", "Joel"),
    "Amos": ("AMO", "Amós"),
    "Obadiah": ("OBA", "Abdías"),
    "Jonah": ("JON", "Jonás"),
    "Micah": ("MIC", "Miqueas"),
    "Nahum": ("NAM", "Nahúm"),
    "Habakkuk": ("HAB", "Habacuc"),
    "Zephaniah": ("ZEP", "Sofonías"),
    "Haggai": ("HAG", "Hageo"),
    "Zechariah": ("ZEC", "Zacarías"),
    "Malachi": ("MAL", "Malaquías"),
    "Matthew": ("MAT", "Mateo"),
    "Mark": ("MRK", "Marcos"),
    "Luke": ("LUK", "Lucas"),
    "John": ("JHN", "Juan"),
    "Acts": ("ACT", "Hechos"),
    "Romans": ("ROM", "Romanos"),
    "I Corinthians": ("1CO", "1 Corintios"),
    "II Corinthians": ("2CO", "2 Corintios"),
    "Galatians": ("GAL", "Gálatas"),
    "Ephesians": ("EPH", "Efesios"),
    "Philippians": ("PHP", "Filipenses"),
    "Colossians": ("COL", "Colosenses"),
    "I Thessalonians": ("1TH", "1 Tesalonicenses"),
    "II Thessalonians": ("2TH", "2 Tesalonicenses"),
    "I Timothy": ("1TI", "1 Timoteo"),
    "II Timothy": ("2TI", "2 Timoteo"),
    "Titus": ("TIT", "Tito"),
    "Philemon": ("PHM", "Filemón"),
    "Hebrews": ("HEB", "Hebreos"),
    "James": ("JAS", "Santiago"),
    "I Peter": ("1PE", "1 Pedro"),
    "II Peter": ("2PE", "2 Pedro"),
    "I John": ("1JN", "1 Juan"),
    "II John": ("2JN", "2 Juan"),
    "III John": ("3JN", "3 Juan"),
    "Jude": ("JUD", "Judas"),
    "Revelation of John": ("REV", "Apocalipsis"),
}


MODULES = {
    "calvin": {
        "folder": "CalvinCommentaries",
        "module_id": "CalvinCommentaries",
        "title": "Calvino: Comentarios sobre la Biblia",
        "author": "Juan Calvino",
        "description": "Comentarios exegéticos de Juan Calvino sobre numerosos libros bíblicos.",
        "source_type": "OSIS",
        "block_type": BlockType.BOOK,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Christian Classics Ethereal Library",
    },
    "catena": {
        "folder": "Catena",
        "module_id": "Catena",
        "title": "Catena Aurea",
        "author": "Santo Tomás de Aquino",
        "description": "Cadena áurea de comentarios patrísticos sobre los cuatro Evangelios.",
        "source_type": "OSIS",
        "block_type": BlockType.CHAPTER,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Proyecto Catena Aurea",
    },
    "clarke": {
        "folder": "Clarke",
        "module_id": "Clarke",
        "title": "Comentario de Adam Clarke",
        "author": "Adam Clarke",
        "description": "Comentario y notas críticas de Adam Clarke sobre la Biblia.",
        "source_type": "OSIS",
        "block_type": BlockType.BOOK,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Wikisource",
    },
    "geneva": {
        "folder": "Geneva",
        "module_id": "Geneva",
        "title": "Notas de la Biblia de Ginebra",
        "author": "Tradición reformada de Ginebra",
        "description": "Notas históricas y teológicas de la Biblia de Ginebra.",
        "source_type": "ThML",
        "block_type": BlockType.BOOK,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Módulo Sword Geneva",
    },
    "lightfoot": {
        "folder": "Lightfoot",
        "module_id": "Lightfoot",
        "title": "Comentario de John Lightfoot",
        "author": "John Lightfoot",
        "description": "Comentario del Nuevo Testamento desde el Talmud y la literatura hebraica.",
        "source_type": "ThML",
        "block_type": BlockType.BOOK,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Philologos",
    },
    "luther": {
        "folder": "Luther",
        "module_id": "Luther",
        "title": "Comentario de Martín Lutero",
        "author": "Martín Lutero",
        "description": "Selección de comentarios de Martín Lutero sobre pasajes bíblicos.",
        "source_type": "OSIS",
        "block_type": BlockType.CHAPTER,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Módulo Sword Luther",
    },
    "rwp": {
        "folder": "RWP",
        "module_id": "RWP",
        "title": "Robertson: Imágenes de Palabras",
        "author": "A. T. Robertson",
        "description": "Notas expositivas y lingüísticas sobre el Nuevo Testamento.",
        "source_type": "OSIS",
        "block_type": BlockType.CHAPTER,
        "kind": "zcom",
        "language": "en",
        "license": "Copyright; distribución gratuita no comercial",
        "text_source": "Bible Foundation",
    },
    "sblgnt-app": {
        "folder": "SBLGNTApp",
        "module_id": "SBLGNTApp",
        "title": "Aparato crítico SBLGNT",
        "author": "Michael W. Holmes / Society of Biblical Literature",
        "description": "Aparato textual del Nuevo Testamento griego SBLGNT.",
        "source_type": "OSIS",
        "block_type": BlockType.BOOK,
        "kind": "zcom",
        "language": "grc",
        "license": "Copyright; distribución gratuita no comercial",
        "text_source": "SBLGNT.com",
    },
    "spurious": {
        "folder": "Spurious",
        "module_id": "Spurious",
        "title": "Pasajes espurios del Nuevo Testamento",
        "author": "Constantin von Tischendorf",
        "description": "Notas sobre pasajes considerados espurios del Nuevo Testamento griego.",
        "source_type": "ThML",
        "block_type": BlockType.BOOK,
        "kind": "rawcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Bible Today",
    },
    "wesley": {
        "folder": "Wesley",
        "module_id": "Wesley",
        "title": "Notas de John Wesley sobre la Biblia",
        "author": "John Wesley",
        "description": "Notas expositivas de John Wesley sobre los libros de la Biblia.",
        "source_type": "ThML",
        "block_type": BlockType.BOOK,
        "kind": "zcom",
        "language": "en",
        "license": "Dominio Público",
        "text_source": "Módulo Sword Wesley",
    },
}


BUFFER_CACHE: dict[tuple[int, str, int], bytes] = {}


def fast_decompressed_text(module: ZTextModule, testament: str, buf_num: int) -> bytes:
    """Cachea los bloques comprimidos para no descomprimirlos por cada versículo."""
    cache_key = (id(module), testament, buf_num)
    if cache_key in BUFFER_CACHE:
        return BUFFER_CACHE[cache_key]

    testament_data = module._testaments[testament]
    if (buf_num + 1) * 12 > testament_data.b2l_size:
        return b""

    testament_data.b2l_name.seek(buf_num * 12)
    offset, size, _ = struct.unpack("<III", testament_data.b2l_name.read(12))
    if offset + size > testament_data.text_size:
        return b""

    testament_data.text_name.seek(offset)
    compressed_data = testament_data.text_name.read(size)
    if module._sappire_decryptor:
        compressed_data = module._sappire_decryptor.decrypt_bytes(compressed_data)

    try:
        decompressed_data = zlib.decompress(compressed_data)
    except zlib.error:
        decompressed_data = b""

    BUFFER_CACHE[cache_key] = decompressed_data
    return decompressed_data


def clean_commentary(raw_text: str) -> str:
    """Convierte OSIS/ThML a texto legible y conserva separaciones de párrafo."""
    if not raw_text or not raw_text.strip():
        return ""

    text = html.unescape(raw_text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(
        r'<div[^>]*type=["\'](?:x-p|paragraph|section)["\'][^>]*/?>',
        "\n\n",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"</?(?:p|title|h[1-6])[^>]*>", "\n\n", text, flags=re.IGNORECASE)

    soup = BeautifulSoup(text, "html.parser")
    for tag in soup.find_all(["script", "style", "note"]):
        tag.decompose()

    plain = soup.get_text(" ", strip=False)
    plain = html.unescape(plain)
    plain = plain.replace("\xa0", " ")
    plain = re.sub(r"[ \t]+", " ", plain)
    plain = re.sub(r" *\n *", "\n", plain)
    plain = re.sub(r"\n{3,}", "\n\n", plain)
    plain = plain.strip()

    # Algunos módulos (especialmente Luther) devuelven el aviso de ausencia
    # en cada versículo del libro. No es contenido editorial y provocaría que
    # la interfaz repita el mismo mensaje decenas de veces.
    normalized = re.sub(r"\s+", " ", plain).lower()
    unavailable_markers = (
        "no commentary on these verses is yet included",
        "no commentary on this verse is yet included",
    )
    if any(marker in normalized for marker in unavailable_markers):
        return ""

    return plain


def organize_commentary_entries(
    raw_chapters: dict[str, dict[str, str]],
) -> tuple[list[str], dict[str, dict[str, Any]]]:
    """Conserva el alcance real de cada bloque del módulo Sword.

    Algunos módulos devuelven un bloque de libro o capítulo al consultar
    cualquiera de sus versículos. Si se guarda directamente bajo cada número
    de versículo, la interfaz termina mostrando el mismo texto repetido. Los
    textos repetidos dentro de un capítulo se convierten en un solo comentario
    de capítulo; los que se repiten en varios capítulos y también varias veces
    dentro de alguno de ellos se conservan una sola vez como comentario del
    libro. Solo los textos que aparecen una vez permanecen ligados a un verso.
    """
    locations: dict[str, dict[str, list[str]]] = {}
    for chapter, verses in raw_chapters.items():
        for verse, text in verses.items():
            locations.setdefault(text, {}).setdefault(chapter, []).append(verse)

    book_comments: list[str] = []
    book_comment_texts: set[str] = set()
    for text, chapter_locations in locations.items():
        repeated_in_a_chapter = any(
            len(verses) > 1 for verses in chapter_locations.values()
        )
        if len(chapter_locations) > 1 and repeated_in_a_chapter:
            book_comments.append(text)
            book_comment_texts.add(text)

    chapter_data: dict[str, dict[str, Any]] = {}
    for chapter, verses in raw_chapters.items():
        counts: dict[str, int] = {}
        for text in verses.values():
            counts[text] = counts.get(text, 0) + 1

        chapter_comments: list[str] = []
        seen_chapter_comments: set[str] = set()
        verse_comments: dict[str, str] = {}
        for verse, text in verses.items():
            if text in book_comment_texts:
                continue
            if counts[text] > 1:
                if text not in seen_chapter_comments:
                    chapter_comments.append(text)
                    seen_chapter_comments.add(text)
            else:
                verse_comments[verse] = text

        if chapter_comments or verse_comments:
            chapter_data[chapter] = {
                "chapterComments": chapter_comments,
                "verseComments": verse_comments,
            }

    return book_comments, chapter_data


def create_module(module_config: dict[str, Any]):
    module_dir = SOURCE_ROOT / module_config["folder"] / "modules" / "comments"
    if module_config["kind"] == "rawcom":
        data_path = module_dir / "rawcom" / module_config["folder"].lower()
        return RawTextModule(
            module_path=str(data_path),
            versification="kjv",
            encoding="utf-8",
            source_type=module_config["source_type"],
        )

    data_path = module_dir / "zcom" / module_config["folder"].lower()
    module = ZTextModule(
        module_path=str(data_path),
        versification="kjv",
        encoding="utf-8",
        source_type=module_config["source_type"],
        block_type=module_config["block_type"],
        compress_type=CompressType.ZIP,
    )
    module._decompressed_text = fast_decompressed_text.__get__(module, ZTextModule)
    return module


def convert_module(module_id: str, config: dict[str, Any]) -> dict[str, Any]:
    module = create_module(config)
    structure = module.get_structure().get_books()
    books: dict[str, Any] = {}
    total_entries = 0

    for testament in ("ot", "nt"):
        for book in structure.get(testament, []):
            book_info = BOOKS.get(book.name)
            if not book_info:
                print(f"  ⚠ Libro no mapeado, omitido: {book.name}")
                continue

            book_code, book_name = book_info
            raw_chapter_data: dict[str, dict[str, str]] = {}
            for chapter_number, verse_count in enumerate(book.chapter_lengths, start=1):
                verse_data: dict[str, str] = {}
                for verse_number in range(1, verse_count + 1):
                    try:
                        raw = module.get(
                            books=[book.name],
                            chapters=[chapter_number],
                            verses=[verse_number],
                            clean=False,
                        )
                    except Exception as error:
                        print(f"  ⚠ {book.name} {chapter_number}:{verse_number}: {error}")
                        continue

                    cleaned = clean_commentary(raw)
                    if cleaned:
                        verse_data[str(verse_number)] = cleaned

                if verse_data:
                    raw_chapter_data[str(chapter_number)] = verse_data

            book_comments, chapter_data = organize_commentary_entries(raw_chapter_data)
            total_entries += len(book_comments)
            total_entries += sum(
                len(data["chapterComments"]) + len(data["verseComments"])
                for data in chapter_data.values()
            )

            if book_comments or chapter_data:
                books[book_code] = {
                    "bookCode": book_code,
                    "bookName": book_name,
                    "bookComments": book_comments,
                    "chapters": chapter_data,
                }
                print(f"  ✓ {book_name}: {len(chapter_data)} capítulos")

    return {
        "id": module_id,
        "moduleId": config["module_id"],
        "title": config["title"],
        "author": config["author"],
        "description": config["description"],
        "language": config["language"],
        "sourceType": config["source_type"],
        "license": config["license"],
        "textSource": config["text_source"],
        "totalEntries": total_entries,
        "totalBooks": len(books),
        "books": books,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Convierte comentarios Sword a JSON para AletheiaGateway")
    parser.add_argument(
        "--only",
        nargs="+",
        choices=sorted(MODULES),
        help="Convierte solo los identificadores indicados",
    )
    args = parser.parse_args()

    if not SOURCE_ROOT.exists():
        raise SystemExit(f"No existe el directorio fuente: {SOURCE_ROOT}")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    selected = args.only or list(MODULES)

    print("=" * 64)
    print("📚 Convirtiendo módulos Sword de comentarios")
    print(f"📁 Fuente: {SOURCE_ROOT}")
    print(f"📁 Salida: {OUTPUT_ROOT}")
    print("=" * 64)

    converted_catalogs: list[dict[str, Any]] = []

    for module_id in selected:
        print(f"\n▶ {module_id}: {MODULES[module_id]['title']}")
        catalog = convert_module(module_id, MODULES[module_id])
        converted_catalogs.append(catalog)

        source_output_root = OUTPUT_ROOT / module_id
        source_output_root.mkdir(parents=True, exist_ok=True)
        old_output_file = OUTPUT_ROOT / f"{module_id}.json"
        if old_output_file.exists():
            old_output_file.unlink()

        for old_book_file in source_output_root.glob("*.json"):
            old_book_file.unlink()

        for book_code, book_data in catalog["books"].items():
            book_output = {
                "id": catalog["id"],
                "moduleId": catalog["moduleId"],
                "title": catalog["title"],
                "author": catalog["author"],
                "description": catalog["description"],
                "language": catalog["language"],
                "sourceType": catalog["sourceType"],
                "license": catalog["license"],
                "textSource": catalog["textSource"],
                **book_data,
            }
            (source_output_root / f"{book_code}.json").write_text(
                json.dumps(book_output, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )

        print(
            f"  🎉 {catalog['totalEntries']} entradas en {catalog['totalBooks']} libros → "
            f"{source_output_root.relative_to(OUTPUT_ROOT)}/*.json"
        )

    if not args.only:
        index = {
            "version": 2,
            "sources": [
                {
                    "id": catalog["id"],
                    "moduleId": catalog["moduleId"],
                    "title": catalog["title"],
                    "author": catalog["author"],
                    "description": catalog["description"],
                    "language": catalog["language"],
                    "sourceType": catalog["sourceType"],
                    "license": catalog["license"],
                    "textSource": catalog["textSource"],
                    "totalEntries": catalog["totalEntries"],
                    "totalBooks": catalog["totalBooks"],
                    "bookCodes": sorted(catalog["books"]),
                }
                for catalog in converted_catalogs
            ],
        }
        (OUTPUT_ROOT / "index.json").write_text(
            json.dumps(index, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        print(f"  ✓ Índice de fuentes → {OUTPUT_ROOT / 'index.json'}")

    print("\n✅ Conversión completada.")


if __name__ == "__main__":
    main()
