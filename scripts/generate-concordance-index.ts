import fs from 'fs';
import path from 'path';

const biblesDir = path.resolve('public/data/bibles');
const outputDir = path.resolve('public/data/concordance');

const TRANSLATIONS = [
  'RV1909',
  'BES',
  'VBL',
  'PDDPT',
  'ONBV',
  'BLL',
  'BLM',
  'SpaPlatense',
  'SpaRVG'
];

export const CANONICAL_BOOKS = [
  { code: 'GEN', name: 'Génesis', testament: 'AT', category: 'Pentateuco' },
  { code: 'EXO', name: 'Éxodo', testament: 'AT', category: 'Pentateuco' },
  { code: 'LEV', name: 'Levítico', testament: 'AT', category: 'Pentateuco' },
  { code: 'NUM', name: 'Números', testament: 'AT', category: 'Pentateuco' },
  { code: 'DEU', name: 'Deuteronomio', testament: 'AT', category: 'Pentateuco' },
  { code: 'JOS', name: 'Josué', testament: 'AT', category: 'Históricos' },
  { code: 'JDG', name: 'Jueces', testament: 'AT', category: 'Históricos' },
  { code: 'RUT', name: 'Rut', testament: 'AT', category: 'Históricos' },
  { code: '1SA', name: '1 Samuel', testament: 'AT', category: 'Históricos' },
  { code: '2SA', name: '2 Samuel', testament: 'AT', category: 'Históricos' },
  { code: '1KI', name: '1 Reyes', testament: 'AT', category: 'Históricos' },
  { code: '2KI', name: '2 Reyes', testament: 'AT', category: 'Históricos' },
  { code: '1CH', name: '1 Crónicas', testament: 'AT', category: 'Históricos' },
  { code: '2CH', name: '2 Crónicas', testament: 'AT', category: 'Históricos' },
  { code: 'EZR', name: 'Esdras', testament: 'AT', category: 'Históricos' },
  { code: 'NEH', name: 'Nehemías', testament: 'AT', category: 'Históricos' },
  { code: 'EST', name: 'Ester', testament: 'AT', category: 'Históricos' },
  { code: 'JOB', name: 'Job', testament: 'AT', category: 'Poéticos' },
  { code: 'PSA', name: 'Salmos', testament: 'AT', category: 'Poéticos' },
  { code: 'PRO', name: 'Proverbios', testament: 'AT', category: 'Poéticos' },
  { code: 'ECC', name: 'Eclesiastés', testament: 'AT', category: 'Poéticos' },
  { code: 'SNG', name: 'Cantares', testament: 'AT', category: 'Poéticos' },
  { code: 'ISA', name: 'Isaías', testament: 'AT', category: 'Profetas Mayores' },
  { code: 'JER', name: 'Jeremías', testament: 'AT', category: 'Profetas Mayores' },
  { code: 'LAM', name: 'Lamentaciones', testament: 'AT', category: 'Profetas Mayores' },
  { code: 'EZK', name: 'Ezequiel', testament: 'AT', category: 'Profetas Mayores' },
  { code: 'DAN', name: 'Daniel', testament: 'AT', category: 'Profetas Mayores' },
  { code: 'HOS', name: 'Oseas', testament: 'AT', category: 'Profetas Menores' },
  { code: 'JOL', name: 'Joel', testament: 'AT', category: 'Profetas Menores' },
  { code: 'AMO', name: 'Amós', testament: 'AT', category: 'Profetas Menores' },
  { code: 'OBA', name: 'Abdías', testament: 'AT', category: 'Profetas Menores' },
  { code: 'JON', name: 'Jonás', testament: 'AT', category: 'Profetas Menores' },
  { code: 'MIC', name: 'Miqueas', testament: 'AT', category: 'Profetas Menores' },
  { code: 'NAM', name: 'Nahúm', testament: 'AT', category: 'Profetas Menores' },
  { code: 'HAB', name: 'Habacuc', testament: 'AT', category: 'Profetas Menores' },
  { code: 'ZEP', name: 'Sofonías', testament: 'AT', category: 'Profetas Menores' },
  { code: 'HAG', name: 'Hageo', testament: 'AT', category: 'Profetas Menores' },
  { code: 'ZEC', name: 'Zacarías', testament: 'AT', category: 'Profetas Menores' },
  { code: 'MAL', name: 'Malaquías', testament: 'AT', category: 'Profetas Menores' },
  // Deuterocanónicos
  { code: 'TOB', name: 'Tobías', testament: 'AT', category: 'Deuterocanónicos' },
  { code: 'JDT', name: 'Judit', testament: 'AT', category: 'Deuterocanónicos' },
  { code: 'WIS', name: 'Sabiduría', testament: 'AT', category: 'Deuterocanónicos' },
  { code: 'SIR', name: 'Eclesiástico', testament: 'AT', category: 'Deuterocanónicos' },
  { code: 'BAR', name: 'Baruc', testament: 'AT', category: 'Deuterocanónicos' },
  { code: '1MA', name: '1 Macabeos', testament: 'AT', category: 'Deuterocanónicos' },
  { code: '2MA', name: '2 Macabeos', testament: 'AT', category: 'Deuterocanónicos' },
  // NT
  { code: 'MAT', name: 'Mateo', testament: 'NT', category: 'Evangelios' },
  { code: 'MRK', name: 'Marcos', testament: 'NT', category: 'Evangelios' },
  { code: 'LUK', name: 'Lucas', testament: 'NT', category: 'Evangelios' },
  { code: 'JHN', name: 'Juan', testament: 'NT', category: 'Evangelios' },
  { code: 'ACT', name: 'Hechos', testament: 'NT', category: 'Histórico' },
  { code: 'ROM', name: 'Romanos', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: '1CO', name: '1 Corintios', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: '2CO', name: '2 Corintios', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: 'GAL', name: 'Gálatas', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: 'EPH', name: 'Efesios', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: 'PHP', name: 'Filipenses', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: 'COL', name: 'Colosenses', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: '1TH', name: '1 Tesalonicenses', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: '2TH', name: '2 Tesalonicenses', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: '1TI', name: '1 Timoteo', testament: 'NT', category: 'Epístolas Pastorales' },
  { code: '2TI', name: '2 Timoteo', testament: 'NT', category: 'Epístolas Pastorales' },
  { code: 'TIT', name: 'Tito', testament: 'NT', category: 'Epístolas Pastorales' },
  { code: 'PHM', name: 'Filemón', testament: 'NT', category: 'Epístolas Paulinas' },
  { code: 'HEB', name: 'Hebreos', testament: 'NT', category: 'Epístolas Generales' },
  { code: 'JAS', name: 'Santiago', testament: 'NT', category: 'Epístolas Generales' },
  { code: '1PE', name: '1 Pedro', testament: 'NT', category: 'Epístolas Generales' },
  { code: '2PE', name: '2 Pedro', testament: 'NT', category: 'Epístolas Generales' },
  { code: '1JN', name: '1 Juan', testament: 'NT', category: 'Epístolas Generales' },
  { code: '2JN', name: '2 Juan', testament: 'NT', category: 'Epístolas Generales' },
  { code: '3JN', name: '3 Juan', testament: 'NT', category: 'Epístolas Generales' },
  { code: 'JUD', name: 'Judas', testament: 'NT', category: 'Epístolas Generales' },
  { code: 'REV', name: 'Apocalipsis', testament: 'NT', category: 'Profético' }
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[«»“”"''`.,;:!?¡¿()\-[\]{}_/\\*#%~^+=<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildConcordanceIndex() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('=== Generando Índices de Concordancia Bíblica ===');

  for (const transId of TRANSLATIONS) {
    const transPath = path.join(biblesDir, transId);
    if (!fs.existsSync(transPath)) {
      console.warn(`Translation dir not found: ${transPath}`);
      continue;
    }

    const allVerses: Array<[
      string, // 0: bookCode
      string, // 1: bookName
      number, // 2: chapter
      number, // 3: verseNumber
      string, // 4: rawText
      string, // 5: normalizedText
      string, // 6: testament ('AT' | 'NT')
      string  // 7: category ('Evangelios', etc.)
    ]> = [];

    for (const book of CANONICAL_BOOKS) {
      const bookFile = path.join(transPath, `${book.code}.json`);
      if (!fs.existsSync(bookFile)) continue;

      try {
        const bookData = JSON.parse(fs.readFileSync(bookFile, 'utf-8'));
        const chapters = bookData.chapters || {};

        for (const chNum of Object.keys(chapters).sort((a, b) => Number(a) - Number(b))) {
          const ch = chapters[chNum];
          const verses = ch.verses || [];

          for (const v of verses) {
            const rawText = (v.text || '').trim();
            if (!rawText) continue;

            const norm = normalizeText(rawText);
            allVerses.push([
              book.code,
              book.name,
              Number(chNum),
              Number(v.number),
              rawText,
              norm,
              book.testament,
              book.category
            ]);
          }
        }
      } catch (err) {
        console.error(`Error reading ${bookFile}:`, err);
      }
    }

    const outputFile = path.join(outputDir, `${transId}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(allVerses), 'utf-8');
    const stats = fs.statSync(outputFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✓ ${transId}: ${allVerses.length} versículos indexados (${sizeMB} MB) -> ${outputFile}`);
  }

  console.log('=== Generación de Concordancia Completada Exitosamente ===');
}

buildConcordanceIndex();