"""
Convertidor del devocional de C.H. Spurgeon (Morning and Evening) desde el módulo Sword SME
ubicado en C:/Users/J/Desktop/Versiones/otros/otros/SME
a public/data/devotionals/sme-spurgeon.json
"""

import os
import sys
import json
import re
import html
import struct
import zlib
from bs4 import BeautifulSoup

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BOOK_REF_MAP = {
    "Gen": "Génesis", "Exod": "Éxodo", "Lev": "Levítico", "Num": "Números", "Deut": "Deuteronomio",
    "Josh": "Josué", "Judg": "Jueces", "Ruth": "Rut", "1Sam": "1 Samuel", "2Sam": "2 Samuel",
    "1Kgs": "1 Reyes", "2Kgs": "2 Reyes", "1Chr": "1 Crónicas", "2Chr": "2 Crónicas",
    "Ezra": "Esdras", "Neh": "Nehemías", "Esth": "Ester", "Job": "Job", "Ps": "Salmos",
    "Prov": "Proverbios", "Eccl": "Eclesiastés", "Song": "Cantares", "Isa": "Isaías",
    "Jer": "Jeremías", "Lam": "Lamentaciones", "Ezek": "Ezequiel", "Dan": "Daniel",
    "Hos": "Oseas", "Joel": "Joel", "Amos": "Amós", "Obad": "Abdías", "Jonah": "Jonás",
    "Mic": "Miqueas", "Nah": "Nahúm", "Hab": "Habacuc", "Zeph": "Sofonías", "Hag": "Hageo",
    "Zech": "Zacarías", "Mal": "Malaquías", "Matt": "Mateo", "Mark": "Marcos", "Luke": "Lucas",
    "John": "Juan", "Acts": "Hechos", "Rom": "Romanos", "1Cor": "1 Corintios", "2Cor": "2 Corintios",
    "Gal": "Gálatas", "Eph": "Efesios", "Phil": "Filipenses", "Col": "Colosenses",
    "1Thess": "1 Tesalonicenses", "2Thess": "2 Tesalonicenses", "1Tim": "1 Timoteo", "2Tim": "2 Timoteo",
    "Titus": "Tito", "Phlm": "Filemón", "Heb": "Hebreos", "Jas": "Santiago", "1Pet": "1 Pedro",
    "2Pet": "2 Pedro", "1John": "1 Juan", "2John": "2 Juan", "3John": "3 Juan", "Jude": "Judas",
    "Rev": "Apocalipsis"
}

MONTH_NAMES_ES = {
    "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
    "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
    "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
}

def clean_osis_ref(osis_ref: str) -> str:
    if not osis_ref:
        return ""
    ref = osis_ref.replace("Bible:", "")
    parts = ref.split(".")
    if len(parts) >= 2:
        book_key = parts[0]
        book_es = BOOK_REF_MAP.get(book_key, book_key)
        if len(parts) == 3:
            return f"{book_es} {parts[1]}:{parts[2]}"
        return f"{book_es} {parts[1]}"
    return ref

def parse_section(section_soup, time_type="morning"):
    # Extract Title
    title_tag = section_soup.find("title")
    title_text = title_tag.get_text().strip() if title_tag else ("Lectura Matutina" if time_type == "morning" else "Lectura Vespertina")
    if title_tag:
        title_tag.decompose()

    # Extract Reference & Verse quote
    ref_tag = section_soup.find("reference")
    scripture_ref = ""
    if ref_tag:
        osis = ref_tag.get("osisref", "")
        scripture_ref = clean_osis_ref(osis) if osis else ref_tag.get_text().strip()
        ref_tag.decompose()

    paragraphs = []
    verse_quote = ""

    for p in section_soup.find_all("p"):
        hi = p.find("hi")
        if hi and not verse_quote and (not paragraphs or len(paragraphs) == 0):
            verse_quote = hi.get_text().strip()
            hi.decompose()
        p_text = p.get_text().strip()
        p_text = re.sub(r'\s+', ' ', p_text)
        if p_text:
            paragraphs.append(p_text)

    body = "\n\n".join(paragraphs)

    return {
        "title": title_text,
        "scriptureReference": scripture_ref,
        "verseQuote": verse_quote,
        "content": body
    }

def convert_sme():
    base = r"C:\Users\J\Desktop\Versiones\otros\otros\SME\modules\lexdict\zld\devotionals\sme\sme"
    out_file = r"C:\Users\J\Desktop\alethia-gateway\public\data\devotionals\sme-spurgeon.json"
    os.makedirs(os.path.dirname(out_file), exist_ok=True)

    print("========================================================")
    print("📖 Ingestando Devocional de C.H. Spurgeon (SME zLD)...")
    print("========================================================")

    with open(base + ".zdx", "rb") as f:
        zdx_data = f.read()

    with open(base + ".zdt", "rb") as f:
        zdt_data = f.read()

    full_decompressed_text = ""
    for i in range(len(zdx_data) // 8):
        off, size = struct.unpack_from("<II", zdx_data, i * 8)
        decomp = zlib.decompress(zdt_data[off:off+size])
        full_decompressed_text += decomp.decode("utf-8", errors="ignore")

    # Split by <div type="entry" osisID="MM.DD">
    chunks = re.split(r'<div type="entry" osisID="(\d\d\.\d\d)">', full_decompressed_text)

    devotionals_by_date = {}

    # chunks format: [preamble, dateKey1, content1, dateKey2, content2, ...]
    for i in range(1, len(chunks), 2):
        date_key = chunks[i]
        entry_raw = chunks[i + 1]

        month_str, day_str = date_key.split(".")
        month_name = MONTH_NAMES_ES.get(month_str, month_str)
        display_date = f"{int(day_str)} de {month_name}"

        soup = BeautifulSoup(f"<root>{entry_raw}</root>", "html.parser")

        # Morning section
        morning_sec = soup.find("div", {"osisid": f"{date_key}.am"})
        morning_data = None
        if morning_sec:
            morning_data = parse_section(morning_sec, "morning")

        # Evening section
        evening_sec = soup.find("div", {"osisid": f"{date_key}.pm"})
        evening_data = None
        if evening_sec:
            evening_data = parse_section(evening_sec, "evening")

        devotionals_by_date[date_key] = {
            "dateKey": date_key,
            "month": int(month_str),
            "day": int(day_str),
            "displayDate": display_date,
            "morning": morning_data,
            "evening": evening_data
        }

    catalog = {
        "id": "sme-spurgeon",
        "title": "Lecturas Matutinas y Vespertinas",
        "author": "Charles H. Spurgeon",
        "totalDays": len(devotionals_by_date),
        "days": devotionals_by_date
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"🎉 Devocionales ingestados: {len(devotionals_by_date)} días completos (Mañana y Noche).")
    print(f"📁 Guardado en: {out_file}")
    print("========================================================")

if __name__ == "__main__":
    convert_sme()
