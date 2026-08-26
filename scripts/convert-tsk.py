"""
Script para convertir el módulo Sword TSK (Treasury of Scripture Knowledge)
ubicado en C:/Users/J/Desktop/Versiones/otros/otros/TSK
a archivos JSON estructurados en public/data/cross-references/TSK/[BOOK].json
"""

import os
import sys
import json
import re
import html

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from bs4 import BeautifulSoup
from pysword.bible import ZTextModule, BlockType, CompressType

BOOK_MAP = {
    # Pentateuco / Históricos
    "Gen": {"code": "GEN", "name": "Génesis", "testament": "AT"},
    "Exod": {"code": "EXO", "name": "Éxodo", "testament": "AT"},
    "Lev": {"code": "LEV", "name": "Levítico", "testament": "AT"},
    "Num": {"code": "NUM", "name": "Números", "testament": "AT"},
    "Deut": {"code": "DEU", "name": "Deuteronomio", "testament": "AT"},
    "Josh": {"code": "JOS", "name": "Josué", "testament": "AT"},
    "Judg": {"code": "JDG", "name": "Jueces", "testament": "AT"},
    "Ruth": {"code": "RUT", "name": "Rut", "testament": "AT"},
    "1Sam": {"code": "1SA", "name": "1 Samuel", "testament": "AT"},
    "2Sam": {"code": "2SA", "name": "2 Samuel", "testament": "AT"},
    "1Kgs": {"code": "1KI", "name": "1 Reyes", "testament": "AT"},
    "2Kgs": {"code": "2KI", "name": "2 Reyes", "testament": "AT"},
    "1Chr": {"code": "1CH", "name": "1 Crónicas", "testament": "AT"},
    "2Chr": {"code": "2CH", "name": "2 Crónicas", "testament": "AT"},
    "Ezra": {"code": "EZR", "name": "Esdras", "testament": "AT"},
    "Neh": {"code": "NEH", "name": "Nehemías", "testament": "AT"},
    "Esth": {"code": "EST", "name": "Ester", "testament": "AT"},
    # Poéticos y Sapienciales
    "Job": {"code": "JOB", "name": "Job", "testament": "AT"},
    "Ps": {"code": "PSA", "name": "Salmos", "testament": "AT"},
    "Prov": {"code": "PRO", "name": "Proverbios", "testament": "AT"},
    "Eccl": {"code": "ECC", "name": "Eclesiastés", "testament": "AT"},
    "Song": {"code": "SNG", "name": "Cantares", "testament": "AT"},
    # Profetas Mayores
    "Isa": {"code": "ISA", "name": "Isaías", "testament": "AT"},
    "Jer": {"code": "JER", "name": "Jeremías", "testament": "AT"},
    "Lam": {"code": "LAM", "name": "Lamentaciones", "testament": "AT"},
    "Ezek": {"code": "EZK", "name": "Ezequiel", "testament": "AT"},
    "Dan": {"code": "DAN", "name": "Daniel", "testament": "AT"},
    # Profetas Menores
    "Hos": {"code": "HOS", "name": "Oseas", "testament": "AT"},
    "Joel": {"code": "JOL", "name": "Joel", "testament": "AT"},
    "Amos": {"code": "AMO", "name": "Amós", "testament": "AT"},
    "Obad": {"code": "OBA", "name": "Abdías", "testament": "AT"},
    "Jonah": {"code": "JON", "name": "Jonás", "testament": "AT"},
    "Mic": {"code": "MIC", "name": "Miqueas", "testament": "AT"},
    "Nah": {"code": "NAM", "name": "Nahúm", "testament": "AT"},
    "Hab": {"code": "HAB", "name": "Habacuc", "testament": "AT"},
    "Zeph": {"code": "ZEP", "name": "Sofonías", "testament": "AT"},
    "Hag": {"code": "HAG", "name": "Hageo", "testament": "AT"},
    "Zec": {"code": "ZEC", "name": "Zacarías", "testament": "AT"},
    "Mal": {"code": "MAL", "name": "Malaquías", "testament": "AT"},
    # Nuevo Testamento
    "Matt": {"code": "MAT", "name": "Mateo", "testament": "NT"},
    "Mark": {"code": "MRK", "name": "Marcos", "testament": "NT"},
    "Luke": {"code": "LUK", "name": "Lucas", "testament": "NT"},
    "John": {"code": "JHN", "name": "Juan", "testament": "NT"},
    "Acts": {"code": "ACT", "name": "Hechos", "testament": "NT"},
    "Rom": {"code": "ROM", "name": "Romanos", "testament": "NT"},
    "1Cor": {"code": "1CO", "name": "1 Corintios", "testament": "NT"},
    "2Cor": {"code": "2CO", "name": "2 Corintios", "testament": "NT"},
    "Gal": {"code": "GAL", "name": "Gálatas", "testament": "NT"},
    "Eph": {"code": "EPH", "name": "Efesios", "testament": "NT"},
    "Phil": {"code": "PHP", "name": "Filipenses", "testament": "NT"},
    "Col": {"code": "COL", "name": "Colosenses", "testament": "NT"},
    "1Thess": {"code": "1TH", "name": "1 Tesalonicenses", "testament": "NT"},
    "2Thess": {"code": "2TH", "name": "2 Tesalonicenses", "testament": "NT"},
    "1Tim": {"code": "1TI", "name": "1 Timoteo", "testament": "NT"},
    "2Tim": {"code": "2TI", "name": "2 Timoteo", "testament": "NT"},
    "Titus": {"code": "TIT", "name": "Tito", "testament": "NT"},
    "Phlm": {"code": "PHM", "name": "Filemón", "testament": "NT"},
    "Heb": {"code": "HEB", "name": "Hebreos", "testament": "NT"},
    "Jas": {"code": "JAS", "name": "Santiago", "testament": "NT"},
    "1Pet": {"code": "1PE", "name": "1 Pedro", "testament": "NT"},
    "2Pet": {"code": "2PE", "name": "2 Pedro", "testament": "NT"},
    "1John": {"code": "1JN", "name": "1 Juan", "testament": "NT"},
    "2John": {"code": "2JN", "name": "2 Juan", "testament": "NT"},
    "3John": {"code": "3JN", "name": "3 Juan", "testament": "NT"},
    "Jude": {"code": "JUD", "name": "Judas", "testament": "NT"},
    "Rev": {"code": "REV", "name": "Apocalipsis", "testament": "NT"},
}

BOOK_ABBR_MAP = {
    'Ge': 'Génesis', 'Gen': 'Génesis', 'Genesis': 'Génesis',
    'Ex': 'Éxodo', 'Exo': 'Éxodo', 'Exod': 'Éxodo',
    'Le': 'Levítico', 'Lev': 'Levítico',
    'Nu': 'Números', 'Num': 'Números',
    'De': 'Deuteronomio', 'Deu': 'Deuteronomio', 'Deut': 'Deuteronomio',
    'Jos': 'Josué', 'Josh': 'Josué',
    'Jud': 'Jueces', 'Judg': 'Jueces',
    'Ru': 'Rut', 'Ruth': 'Rut',
    '1Sa': '1 Samuel', '1Sam': '1 Samuel',
    '2Sa': '2 Samuel', '2Sam': '2 Samuel',
    '1Ki': '1 Reyes', '1Kgs': '1 Reyes',
    '2Ki': '2 Reyes', '2Kgs': '2 Reyes',
    '1Ch': '1 Crónicas', '1Chr': '1 Crónicas',
    '2Ch': '2 Crónicas', '2Chr': '2 Crónicas',
    'Ezr': 'Esdras', 'Ezra': 'Esdras',
    'Ne': 'Nehemías', 'Neh': 'Nehemías',
    'Es': 'Ester', 'Est': 'Ester', 'Esth': 'Ester',
    'Job': 'Job',
    'Ps': 'Salmos', 'Psa': 'Salmos', 'Psalm': 'Salmos', 'Psalms': 'Salmos',
    'Pr': 'Proverbios', 'Pro': 'Proverbios', 'Prov': 'Proverbios',
    'Ec': 'Eclesiastés', 'Ecc': 'Eclesiastés', 'Eccl': 'Eclesiastés',
    'So': 'Cantares', 'Song': 'Cantares', 'Cant': 'Cantares',
    'Isa': 'Isaías',
    'Jer': 'Jeremías',
    'La': 'Lamentaciones', 'Lam': 'Lamentaciones',
    'Eze': 'Ezequiel', 'Ezek': 'Ezequiel',
    'Da': 'Daniel', 'Dan': 'Daniel',
    'Ho': 'Oseas', 'Hos': 'Oseas',
    'Joe': 'Joel', 'Joel': 'Joel',
    'Am': 'Amós', 'Amo': 'Amós', 'Amos': 'Amós',
    'Ob': 'Abdías', 'Oba': 'Abdías', 'Obad': 'Abdías',
    'Jon': 'Jonás', 'Jonah': 'Jonás',
    'Mic': 'Miqueas',
    'Na': 'Nahúm', 'Nah': 'Nahúm',
    'Hab': 'Habacuc',
    'Zep': 'Sofonías', 'Zeph': 'Sofonías',
    'Hag': 'Hageo',
    'Zec': 'Zacarías', 'Zech': 'Zacarías',
    'Mal': 'Malaquías',
    'Mt': 'Mateo', 'Mat': 'Mateo', 'Matt': 'Mateo',
    'Mr': 'Marcos', 'Mar': 'Marcos', 'Mark': 'Marcos',
    'Lu': 'Lucas', 'Luk': 'Lucas', 'Luke': 'Lucas',
    'Joh': 'Juan', 'John': 'Juan',
    'Ac': 'Hechos', 'Act': 'Hechos', 'Acts': 'Hechos',
    'Ro': 'Romanos', 'Rom': 'Romanos',
    '1Co': '1 Corintios', '1Cor': '1 Corintios',
    '2Co': '2 Corintios', '2Cor': '2 Corintios',
    'Ga': 'Gálatas', 'Gal': 'Gálatas',
    'Eph': 'Efesios',
    'Php': 'Filipenses', 'Phil': 'Filipenses',
    'Col': 'Colosenses',
    '1Th': '1 Tesalonicenses', '1Thess': '1 Tesalonicenses',
    '2Th': '2 Tesalonicenses', '2Thess': '2 Tesalonicenses',
    '1Ti': '1 Timoteo', '1Tim': '1 Timoteo',
    '2Ti': '2 Timoteo', '2Tim': '2 Timoteo',
    'Tit': 'Tito', 'Titus': 'Tito',
    'Phm': 'Filemón', 'Phlm': 'Filemón',
    'Heb': 'Hebreos',
    'Jas': 'Santiago', 'James': 'Santiago',
    '1Pe': '1 Pedro', '1Pet': '1 Pedro',
    '2Pe': '2 Pedro', '2Pet': '2 Pedro',
    '1Jo': '1 Juan', '1John': '1 Juan',
    '2Jo': '2 Juan', '2John': '2 Juan',
    '3Jo': '3 Juan', '3John': '3 Juan',
    'Jude': 'Judas',
    'Re': 'Apocalipsis', 'Rev': 'Apocalipsis'
}

def parse_tsk_entry(raw_text: str, default_book: str):
    if not raw_text or not raw_text.strip():
        return []

    lines = [l.strip() for l in re.split(r'<br\s*/?>|\n+', raw_text) if l.strip()]
    entries = []

    current_clause = ""
    current_refs = []
    last_book = default_book

    for line in lines:
        if line.startswith('<scripRef passage='):
            # Outline/heading summary in chapter opening, skip
            continue

        scrip_matches = re.findall(r'<scripRef.*?>(.*?)</scripRef>', line, re.DOTALL)
        if scrip_matches:
            for s_match in scrip_matches:
                parts = [p.strip() for p in s_match.split(';') if p.strip()]
                for part in parts:
                    part_clean = html.unescape(part).strip()
                    m = re.match(r'^([1-3]?[A-Za-z]+)\s*(.*)$', part_clean)
                    if m and m.group(1) in BOOK_ABBR_MAP:
                        last_book = BOOK_ABBR_MAP[m.group(1)]
                        rest = m.group(2).strip()
                        current_refs.append(f"{last_book} {rest}".strip())
                    elif last_book:
                        current_refs.append(f"{last_book} {part_clean}".strip())
                    else:
                        current_refs.append(part_clean)
        else:
            clean_clause = re.sub(r'<.*?>', '', line).strip()
            clean_clause = html.unescape(clean_clause).strip()
            if clean_clause:
                if current_clause and current_refs:
                    entries.append({
                        "clause": current_clause,
                        "refs": current_refs
                    })
                    current_refs = []
                current_clause = clean_clause.rstrip('. :')
                last_book = default_book

    if current_clause and current_refs:
        entries.append({
            "clause": current_clause,
            "refs": current_refs
        })
    elif current_refs:
        entries.append({
            "clause": "Referencias generales",
            "refs": current_refs
        })

    return entries

def convert_tsk():
    mod_dir = r"C:\Users\J\Desktop\Versiones\otros\otros\TSK\modules\comments\zcom\tsk"
    out_dir = r"C:\Users\J\Desktop\alethia-gateway\public\data\cross-references\TSK"
    os.makedirs(out_dir, exist_ok=True)

    print("========================================================")
    print("🔗 Extrayendo Referencias Cruzadas TSK (Sword zCom)...")
    print("========================================================")

    bible = ZTextModule(
        module_path=mod_dir,
        versification='kjv',
        encoding='utf-8',
        source_type='ThML',
        block_type=BlockType.BOOK,
        compress_type=CompressType.ZIP
    )

    structure = bible.get_structure()
    books_dict = structure.get_books()
    all_books = books_dict.get('ot', []) + books_dict.get('nt', [])

    total_books = 0
    total_verses_with_refs = 0
    total_ref_links = 0

    for book_struct in all_books:
        osis = book_struct.osis_name
        if osis not in BOOK_MAP:
            continue

        book_info = BOOK_MAP[osis]
        book_code = book_info["code"]
        book_name = book_info["name"]

        book_json = {
            "source": "TSK",
            "title": "Treasury of Scripture Knowledge",
            "bookCode": book_code,
            "bookName": book_name,
            "chapters": {}
        }

        has_any_data = False

        for ch in range(1, book_struct.num_chapters + 1):
            ch_str = str(ch)
            num_verses = book_struct.chapter_lengths[ch - 1]
            chapter_entries = {}

            for v in range(1, num_verses + 1):
                try:
                    raw_text = bible.get(books=[book_struct.name], chapters=[ch], verses=[v], clean=False)
                except Exception:
                    raw_text = ""

                parsed = parse_tsk_entry(raw_text, book_name)
                if parsed:
                    v_str = str(v)
                    chapter_entries[v_str] = parsed
                    total_verses_with_refs += 1
                    for e in parsed:
                        total_ref_links += len(e.get("refs", []))
                    has_any_data = True

            if chapter_entries:
                book_json["chapters"][ch_str] = chapter_entries

        if has_any_data:
            out_file = os.path.join(out_dir, f"{book_code}.json")
            with open(out_file, 'w', encoding='utf-8') as f:
                json.dump(book_json, f, ensure_ascii=False, indent=None, separators=(',', ':'))
            total_books += 1
            print(f"  ✓ [{book_code}] {book_name} -> {len(book_json['chapters'])} capítulos")

    print("\n========================================================")
    print(f"🎉 TSK completado: {total_books} libros, {total_verses_with_refs} versículos con referencias, {total_ref_links} citas cruzadas.")
    print(f"📁 Guardado en: {out_dir}")
    print("========================================================")

if __name__ == "__main__":
    convert_tsk()
