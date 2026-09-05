"""
Convertidor ultra-rápido de Reina Valera Gómez (SpaRVG) desde formato Sword zText (LZSS/OSIS)
a la estructura JSON de AletheiaGateway en public/data/bibles/SpaRVG/
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

# Fast Sword LZSS Decompressor (CrossWire algorithm)
def decompress_sword_lzss(data):
    N = 4096
    F = 18
    THRESHOLD = 2
    
    text_buf = bytearray(N + F - 1)
    for i in range(N - F):
        text_buf[i] = ord(' ')
        
    r = N - F
    flags = 0
    src_idx = 0
    src_len = len(data)
    out = bytearray()
    
    while src_idx < src_len:
        flags >>= 1
        if (flags & 256) == 0:
            if src_idx >= src_len:
                break
            c = data[src_idx]
            src_idx += 1
            flags = c | 0xFF00
            
        if flags & 1:
            if src_idx >= src_len:
                break
            c = data[src_idx]
            src_idx += 1
            out.append(c)
            text_buf[r] = c
            r = (r + 1) & (N - 1)
        else:
            if src_idx >= src_len:
                break
            i = data[src_idx]
            src_idx += 1
            if src_idx >= src_len:
                break
            j = data[src_idx]
            src_idx += 1
            
            i |= ((j & 0xF0) << 4)
            j = (j & 0x0F) + THRESHOLD
            
            for k in range(j + 1):
                c = text_buf[(i + k) & (N - 1)]
                out.append(c)
                text_buf[r] = c
                r = (r + 1) & (N - 1)
                
    return bytes(out)

# Fast Buffer Cache
BUFFER_CACHE = {}

def fast_decompressed_text(self, testament, buf_num):
    cache_key = (testament, buf_num)
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

    decompressed_data = decompress_sword_lzss(compressed_data)
    BUFFER_CACHE[cache_key] = decompressed_data
    return decompressed_data

ZTextModule._decompressed_text = fast_decompressed_text

BOOK_MAP = {
    # Old Testament
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
    "Job": {"code": "JOB", "name": "Job", "testament": "AT"},
    "Ps": {"code": "PSA", "name": "Salmos", "testament": "AT"},
    "Prov": {"code": "PRO", "name": "Proverbios", "testament": "AT"},
    "Eccl": {"code": "ECC", "name": "Eclesiastés", "testament": "AT"},
    "Song": {"code": "SNG", "name": "Cantares", "testament": "AT"},
    "Isa": {"code": "ISA", "name": "Isaías", "testament": "AT"},
    "Jer": {"code": "JER", "name": "Jeremías", "testament": "AT"},
    "Lam": {"code": "LAM", "name": "Lamentaciones", "testament": "AT"},
    "Ezek": {"code": "EZK", "name": "Ezequiel", "testament": "AT"},
    "Dan": {"code": "DAN", "name": "Daniel", "testament": "AT"},
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

    # New Testament
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

CALLER_SYMBOLS = ['*', '†', '‡', '§', '¶', '#', '♠', '♣', '♥', '♦']

def parse_osis_verse(raw_xml_str, fn_counter):
    if not raw_xml_str:
        return [], [], ""
    
    # Fast path if no tags
    if '<' not in raw_xml_str:
        clean = html.unescape(raw_xml_str).strip()
        clean = re.sub(r'\s+', ' ', clean)
        return [], [], clean
        
    wrapped = f"<root>{raw_xml_str}</root>"
    soup = BeautifulSoup(wrapped, 'html.parser')
    
    headings = []
    for title_tag in soup.find_all('title'):
        title_text = title_tag.get_text().strip()
        if title_text:
            title_text = re.sub(r'\s+', ' ', title_text)
            headings.append(title_text)
        title_tag.decompose()
        
    footnotes = []
    for note_tag in soup.find_all('note'):
        ref_tag = note_tag.find('reference')
        if ref_tag:
            ref_tag.decompose()
            
        note_text = note_tag.get_text().strip()
        note_text = html.unescape(note_text)
        note_text = re.sub(r'\s+', ' ', note_text)
        if note_text:
            fn_idx = len(footnotes)
            caller = CALLER_SYMBOLS[fn_idx % len(CALLER_SYMBOLS)]
            fn_id = f"FN{fn_counter[0]}"
            fn_counter[0] += 1
            footnotes.append({
                "id": fn_id,
                "caller": caller,
                "text": note_text
            })
        note_tag.decompose()
        
    clean_text = soup.get_text()
    clean_text = html.unescape(clean_text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return headings, footnotes, clean_text

def convert_sparvg():
    source_dir = r"C:\Users\J\Desktop\Versiones\SpaRVG"
    out_dir = r"C:\Users\J\Desktop\aletheia-gateway\public\data\bibles\SpaRVG"
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"📖 Cargando módulo Sword Reina Valera Gómez desde {source_dir}...")
    modules = SwordModules(source_dir)
    modules.parse_modules()
    
    modules._modules['SpaRVG']['compress_type'] = CompressType.LZSS
    bible = modules.get_bible_from_module('SpaRVG')
    bible._compress_type = CompressType.LZSS
    
    structure = bible.get_structure()
    books_dict = structure.get_books()
    
    all_books = books_dict['ot'] + books_dict['nt']
    total_chapters_converted = 0
    total_verses_converted = 0
    books_converted_count = 0
    
    for book_struct in all_books:
        osis = book_struct.osis_name
        if osis not in BOOK_MAP:
            print(f"  [OMITIDO] Libro no mapeado: {book_struct.name} ({osis})")
            continue
            
        book_info = BOOK_MAP[osis]
        book_code = book_info["code"]
        book_name = book_info["name"]
        testament = book_info["testament"]
        
        book_data = {
            "versionId": "SpaRVG",
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
                except Exception as e:
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
                total_verses_converted += 1
                book_has_verses = True
                
            if chapter_verses:
                book_data["chapters"][ch_key] = {
                    "chapter": ch,
                    "verses": chapter_verses
                }
                total_chapters_converted += 1
                
        if book_has_verses:
            out_file = os.path.join(out_dir, f"{book_code}.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(book_data, f, ensure_ascii=False, indent=2)
            books_converted_count += 1
            print(f"  ✓ {book_name} ({book_code}): {len(book_data['chapters'])} capítulos generados")
            
    print(f"\n✨ Conversión completada para Reina Valera Gómez:")
    print(f"  - Libros procesados: {books_converted_count}")
    print(f"  - Capítulos convertidos: {total_chapters_converted}")
    print(f"  - Versículos procesados: {total_verses_converted}")
    print(f"  - Destino: {out_dir}")

if __name__ == "__main__":
    convert_sparvg()
