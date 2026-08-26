"""
Convertidor integral de los 11 módulos Sword multilingües (Inglés, Griego, Hebreo y Alemán)
desde C:/Users/J/Desktop/Versiones/otros a la estructura JSON de AlethiaGateway.
"""

import os
import sys
import json
import re
import html
import struct
import zlib

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from bs4 import BeautifulSoup
from pysword.modules import SwordModules
from pysword.bible import ZTextModule, CompressType

# Fast Buffer Cache for pysword
BUFFER_CACHE = {}

def fast_decompressed_text(self, testament, buf_num):
    cache_key = (id(self), testament, buf_num)
    if cache_key in BUFFER_CACHE:
        return BUFFER_CACHE[cache_key]
        
    if ((buf_num + 1) * 12) > self._testaments[testament].b2l_size:
        return b''

    buf_to_loc = self._testaments[testament].b2l_name
    text = self._testaments[testament].text_name

    buf_to_loc.seek(buf_num * 12)
    offset, size, uc_size = struct.unpack('<III', buf_to_loc.read(12))

    if (offset + size) > self._testaments[testament].text_size:
        return b''

    text.seek(offset)
    compressed_data = text.read(size)

    if self._compress_type == CompressType.ZIP:
        decompressed_data = zlib.decompress(compressed_data)
    else:
        decompressed_data = compressed_data

    BUFFER_CACHE[cache_key] = decompressed_data
    return decompressed_data

ZTextModule._decompressed_text = fast_decompressed_text

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
    "Zech": {"code": "ZEC", "name": "Zacarías", "testament": "AT"},
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
    # Deuterocanónicos y Apócrifos (LXX / Wycliffe)
    "Tob": {"code": "TOB", "name": "Tobías", "testament": "AT"},
    "Jdt": {"code": "JDT", "name": "Judit", "testament": "AT"},
    "Wis": {"code": "WIS", "name": "Sabiduría", "testament": "AT"},
    "Sir": {"code": "SIR", "name": "Eclesiástico", "testament": "AT"},
    "Bar": {"code": "BAR", "name": "Baruc", "testament": "AT"},
    "1Macc": {"code": "1MA", "name": "1 Macabeos", "testament": "AT"},
    "2Macc": {"code": "2MA", "name": "2 Macabeos", "testament": "AT"},
    "3Macc": {"code": "3MA", "name": "3 Macabeos", "testament": "AT"},
    "4Macc": {"code": "4MA", "name": "4 Macabeos", "testament": "AT"},
    "1Esd": {"code": "1ES", "name": "1 Esdras", "testament": "AT"},
    "2Esd": {"code": "2ES", "name": "2 Esdras", "testament": "AT"},
    "PrMan": {"code": "MAN", "name": "Oración de Manasés", "testament": "AT"},
    "EpJer": {"code": "EPJ", "name": "Epístola de Jeremías", "testament": "AT"},
    "Sus": {"code": "SUS", "name": "Susana", "testament": "AT"},
    "Bel": {"code": "BEL", "name": "Bel y el Dragón", "testament": "AT"},
    "PrAzar": {"code": "AZA", "name": "Oración de Azarías", "testament": "AT"},
    "EpLao": {"code": "LAO", "name": "Laodicenses", "testament": "NT"},
    "AddPs": {"code": "PSA151", "name": "Salmo 151", "testament": "AT"},
    "PssSol": {"code": "PSS", "name": "Salmos de Salomón", "testament": "AT"},
    "Odes": {"code": "ODE", "name": "Odas", "testament": "AT"},
    "1En": {"code": "1EN", "name": "1 Enoc", "testament": "AT"},
}

MODULES_CONFIG = [
    {
        "id": "KJV",
        "name": "King James Version (1769)",
        "shortName": "KJV",
        "language": "en",
        "description": "Traducción histórica inglesa por excelencia con números Strong y morfología.",
        "copyright": "Dominio Público",
        "dir": "KJV",
        "modKey": "KJV"
    },
    {
        "id": "ASV",
        "name": "American Standard Version (1901)",
        "shortName": "ASV",
        "language": "en",
        "description": "Revisión estadounidense de alta fidelidad literal y rigor erudito.",
        "copyright": "Dominio Público",
        "dir": "ASV",
        "modKey": "ASV"
    },
    {
        "id": "Darby",
        "name": "Darby Bible (1890)",
        "shortName": "DARBY",
        "language": "en",
        "description": "Traducción directa y literal de John Nelson Darby de los textos originales.",
        "copyright": "Dominio Público",
        "dir": "Darby",
        "modKey": "Darby"
    },
    {
        "id": "Rotherham",
        "name": "The Emphasised Bible (1902)",
        "shortName": "ROTH",
        "language": "en",
        "description": "Edición de Joseph Bryant Rotherham con énfasis en modismos y tiempos verbales originales.",
        "copyright": "Dominio Público",
        "dir": "Rotherham",
        "modKey": "Rotherham"
    },
    {
        "id": "Noyes",
        "name": "Noyes Translation (1869)",
        "shortName": "NOYES",
        "language": "en",
        "description": "Traducción académica de George R. Noyes (Poéticos, Profetas y NT).",
        "copyright": "Dominio Público",
        "dir": "Noyes",
        "modKey": "Noyes"
    },
    {
        "id": "Tyndale",
        "name": "William Tyndale Bible (1530/1534)",
        "shortName": "TYNDALE",
        "language": "en",
        "description": "Primera traducción impresa de las Escrituras directamente del hebreo y griego al inglés.",
        "copyright": "Dominio Público",
        "dir": "Tyndale",
        "modKey": "Tyndale"
    },
    {
        "id": "Wycliffe",
        "name": "John Wycliffe Bible (c. 1395)",
        "shortName": "WYC",
        "language": "enm",
        "description": "Traducción histórica de la Vulgata Latina al inglés medio pre-Reforma.",
        "copyright": "Dominio Público",
        "dir": "Wycliffe",
        "modKey": "Wycliffe"
    },
    {
        "id": "GerBoLut",
        "name": "Luther Bibel 1545 (Rechtschreibung)",
        "shortName": "LUT",
        "language": "de",
        "description": "Traducción fundamental alemana de Martín Lutero en ortografía moderna.",
        "copyright": "Dominio Público",
        "dir": "GerBoLut",
        "modKey": "GerBoLut"
    },
    {
        "id": "LXX",
        "name": "Septuaginta (Rahlfs-Hanhart)",
        "shortName": "LXX",
        "language": "grc",
        "description": "Texto griego de los Setenta del Antiguo Testamento con libros deuterocanónicos.",
        "copyright": "Dominio Público / Académico",
        "dir": "LXX",
        "modKey": "LXX"
    },
    {
        "id": "WHNU",
        "name": "Westcott-Hort con variantes NA27/UBS4",
        "shortName": "WHNU",
        "language": "grc",
        "description": "Texto crítico del Nuevo Testamento en Griego Koiné.",
        "copyright": "Dominio Público / Académico",
        "dir": "WHNU",
        "modKey": "WHNU"
    },
    {
        "id": "WLC",
        "name": "Westminster Leningrad Codex",
        "shortName": "WLC",
        "language": "hbo",
        "description": "Texto Masorético hebreo completo con puntuación vocálica (niqqud) y cantilación.",
        "copyright": "Dominio Público / Académico",
        "dir": "WLC",
        "modKey": "WLC"
    },
    {
        "id": "PorAlmeida1911",
        "name": "João Ferreira de Almeida (1911)",
        "shortName": "ALMEIDA",
        "language": "pt",
        "description": "Tradução histórica clássica de referência em língua portuguesa.",
        "copyright": "Dominio Público",
        "dir": "PorAlmeida1911",
        "modKey": "PorAlmeida1911"
    },
    {
        "id": "Vulgate",
        "name": "Biblia Sacra Vulgata Latina",
        "shortName": "VULGATA",
        "language": "la",
        "description": "Traducción monumental en latín eclesiástico de San Jerónimo con libros deuterocanónicos.",
        "copyright": "Dominio Público",
        "dir": "Vulgate",
        "modKey": "Vulgate"
    }
]

CALLER_SYMBOLS = ['*', '†', '‡', '§', '¶', '#', '♠', '♣', '♥', '♦']

def parse_osis_verse(raw_xml_str, fn_counter):
    if not raw_xml_str:
        return [], [], ""
        
    if '<' not in raw_xml_str:
        clean = html.unescape(raw_xml_str).strip()
        clean = re.sub(r'\s+', ' ', clean)
        return [], [], clean

    wrapped = f"<root>{raw_xml_str}</root>"
    soup = BeautifulSoup(wrapped, 'html.parser')

    # Headings
    headings = []
    for title_tag in soup.find_all('title'):
        t_text = title_tag.get_text().strip()
        if t_text:
            t_text = re.sub(r'\s+', ' ', t_text)
            headings.append(t_text)
        title_tag.decompose()

    # Footnotes
    footnotes = []
    for note_tag in soup.find_all('note'):
        ref_tag = note_tag.find('reference')
        if ref_tag:
            ref_tag.decompose()
        n_text = note_tag.get_text().strip()
        n_text = html.unescape(n_text)
        n_text = re.sub(r'\s+', ' ', n_text)
        if n_text:
            fn_idx = len(footnotes)
            caller = CALLER_SYMBOLS[fn_idx % len(CALLER_SYMBOLS)]
            fn_id = f"FN{fn_counter[0]}"
            fn_counter[0] += 1
            footnotes.append({
                "id": fn_id,
                "caller": caller,
                "text": n_text
            })
        note_tag.decompose()

    # Unwrap strongs/morphology tags <w lemma="...">word</w>
    for w in soup.find_all('w'):
        w.unwrap()

    # Clean text
    clean_text = soup.get_text()
    clean_text = html.unescape(clean_text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    return headings, footnotes, clean_text

def convert_all_other_modules():
    base_src_dir = r"C:\Users\J\Desktop\Versiones\otros"
    out_base_dir = r"C:\Users\J\Desktop\alethia-gateway\public\data\bibles"
    
    conversion_summary = []

    for cfg in MODULES_CONFIG:
        mod_id = cfg["id"]
        mod_dir = os.path.join(base_src_dir, cfg["dir"])
        out_dir = os.path.join(out_base_dir, mod_id)
        os.makedirs(out_dir, exist_ok=True)
        
        print(f"\n========================================================")
        print(f"📖 Procesando [{mod_id}] {cfg['name']}...")
        print(f"========================================================")
        
        if not os.path.exists(mod_dir):
            print(f"  ❌ Directorio no existe: {mod_dir}")
            continue
            
        try:
            modules = SwordModules(mod_dir)
            modules.parse_modules()
            mod_keys = list(modules._modules.keys())
            mod_key = cfg["modKey"] if cfg["modKey"] in modules._modules else mod_keys[0]
            
            bible = modules.get_bible_from_module(mod_key)
            structure = bible.get_structure()
            books_dict = structure.get_books()
            
            all_books = books_dict.get('ot', []) + books_dict.get('nt', [])
            total_chapters = 0
            total_verses = 0
            total_books = 0
            
            for book_struct in all_books:
                osis = book_struct.osis_name
                if osis not in BOOK_MAP:
                    continue
                    
                book_info = BOOK_MAP[osis]
                book_code = book_info["code"]
                book_name = book_info["name"]
                testament = book_info["testament"]
                
                book_data = {
                    "versionId": mod_id,
                    "bookCode": book_code,
                    "bookName": book_name,
                    "testament": testament,
                    "chapters": {}
                }
                
                fn_counter = [1]
                book_has_verses = False
                
                for ch in range(1, book_struct.num_chapters + 1):
                    ch_key = str(ch)
                    chapter_verses = []
                    num_verses_in_ch = book_struct.chapter_lengths[ch - 1]
                    
                    for v in range(1, num_verses_in_ch + 1):
                        try:
                            raw_text = bible.get(books=[book_struct.name], chapters=[ch], verses=[v], clean=False)
                        except Exception:
                            raw_text = ""
                            
                        headings, footnotes, clean_text = parse_osis_verse(raw_text, fn_counter)
                        
                        if not clean_text and not headings and not footnotes:
                            continue
                            
                        verse_obj = {
                            "number": v,
                            "text": clean_text
                        }
                        if headings:
                            verse_obj["headings"] = headings
                        if footnotes:
                            verse_obj["footnotes"] = footnotes
                            
                        chapter_verses.append(verse_obj)
                        total_verses += 1
                        book_has_verses = True
                        
                    if chapter_verses:
                        book_data["chapters"][ch_key] = {
                            "chapter": ch,
                            "verses": chapter_verses
                        }
                        total_chapters += 1
                        
                if book_has_verses:
                    out_file = os.path.join(out_dir, f"{book_code}.json")
                    with open(out_file, "w", encoding="utf-8") as f:
                        json.dump(book_data, f, ensure_ascii=False, indent=2)
                    total_books += 1
                    
            print(f"  ✅ [{mod_id}] Convertidos con éxito: {total_books} libros, {total_chapters} capítulos, {total_verses} versículos.")
            conversion_summary.append({
                "id": mod_id,
                "name": cfg["name"],
                "shortName": cfg["shortName"],
                "description": cfg["description"],
                "language": cfg["language"],
                "copyright": cfg["copyright"],
                "booksCount": total_books,
                "chaptersCount": total_chapters,
            })
        except Exception as err:
            print(f"  ❌ ERROR procesando {mod_id}: {err}")
            
    print("\n" + "=" * 80)
    print("RESUMEN DE CONVERSIÓN DE MÓDULOS SWORD")
    print("=" * 80)
    for s in conversion_summary:
        print(f"  • [{s['id']}] {s['name']} ({s['language']}): {s['booksCount']} libros, {s['chaptersCount']} caps.")

if __name__ == "__main__":
    convert_all_other_modules()
