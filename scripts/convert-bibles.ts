import fs from 'fs';
import path from 'path';

const sourceBaseDir = 'C:/Users/J/Desktop/Versiones';
const outputBaseDir = path.resolve('public/data/bibles');

// USFM Code to Spanish standard name and testament
export const USFM_BOOK_MAP: Record<string, { name: string; testament: 'AT' | 'NT'; chapters: number }> = {
  GEN: { name: 'Génesis', testament: 'AT', chapters: 50 },
  EXO: { name: 'Éxodo', testament: 'AT', chapters: 40 },
  LEV: { name: 'Levítico', testament: 'AT', chapters: 27 },
  NUM: { name: 'Números', testament: 'AT', chapters: 36 },
  DEU: { name: 'Deuteronomio', testament: 'AT', chapters: 34 },
  JOS: { name: 'Josué', testament: 'AT', chapters: 24 },
  JDG: { name: 'Jueces', testament: 'AT', chapters: 21 },
  RUT: { name: 'Rut', testament: 'AT', chapters: 4 },
  '1SA': { name: '1 Samuel', testament: 'AT', chapters: 31 },
  '2SA': { name: '2 Samuel', testament: 'AT', chapters: 24 },
  '1KI': { name: '1 Reyes', testament: 'AT', chapters: 22 },
  '2KI': { name: '2 Reyes', testament: 'AT', chapters: 25 },
  '1CH': { name: '1 Crónicas', testament: 'AT', chapters: 29 },
  '2CH': { name: '2 Crónicas', testament: 'AT', chapters: 36 },
  EZR: { name: 'Esdras', testament: 'AT', chapters: 10 },
  NEH: { name: 'Nehemías', testament: 'AT', chapters: 13 },
  EST: { name: 'Ester', testament: 'AT', chapters: 10 },
  JOB: { name: 'Job', testament: 'AT', chapters: 42 },
  PSA: { name: 'Salmos', testament: 'AT', chapters: 150 },
  PRO: { name: 'Proverbios', testament: 'AT', chapters: 31 },
  ECC: { name: 'Eclesiastés', testament: 'AT', chapters: 12 },
  SNG: { name: 'Cantares', testament: 'AT', chapters: 8 },
  ISA: { name: 'Isaías', testament: 'AT', chapters: 66 },
  JER: { name: 'Jeremías', testament: 'AT', chapters: 52 },
  LAM: { name: 'Lamentaciones', testament: 'AT', chapters: 5 },
  EZK: { name: 'Ezequiel', testament: 'AT', chapters: 48 },
  DAN: { name: 'Daniel', testament: 'AT', chapters: 12 },
  HOS: { name: 'Oseas', testament: 'AT', chapters: 14 },
  JOL: { name: 'Joel', testament: 'AT', chapters: 3 },
  AMO: { name: 'Amós', testament: 'AT', chapters: 9 },
  OBA: { name: 'Abdías', testament: 'AT', chapters: 1 },
  JON: { name: 'Jonás', testament: 'AT', chapters: 4 },
  MIC: { name: 'Miqueas', testament: 'AT', chapters: 7 },
  NAM: { name: 'Nahúm', testament: 'AT', chapters: 3 },
  HAB: { name: 'Habacuc', testament: 'AT', chapters: 3 },
  ZEP: { name: 'Sofonías', testament: 'AT', chapters: 3 },
  HAG: { name: 'Hageo', testament: 'AT', chapters: 2 },
  ZEC: { name: 'Zacarías', testament: 'AT', chapters: 14 },
  MAL: { name: 'Malaquías', testament: 'AT', chapters: 4 },
  MAT: { name: 'Mateo', testament: 'NT', chapters: 28 },
  MRK: { name: 'Marcos', testament: 'NT', chapters: 16 },
  LUK: { name: 'Lucas', testament: 'NT', chapters: 24 },
  JHN: { name: 'Juan', testament: 'NT', chapters: 21 },
  ACT: { name: 'Hechos', testament: 'NT', chapters: 28 },
  ROM: { name: 'Romanos', testament: 'NT', chapters: 16 },
  '1CO': { name: '1 Corintios', testament: 'NT', chapters: 16 },
  '2CO': { name: '2 Corintios', testament: 'NT', chapters: 13 },
  GAL: { name: 'Gálatas', testament: 'NT', chapters: 6 },
  EPH: { name: 'Efesios', testament: 'NT', chapters: 6 },
  PHP: { name: 'Filipenses', testament: 'NT', chapters: 4 },
  COL: { name: 'Colosenses', testament: 'NT', chapters: 4 },
  '1TH': { name: '1 Tesalonicenses', testament: 'NT', chapters: 5 },
  '2TH': { name: '2 Tesalonicenses', testament: 'NT', chapters: 3 },
  '1TI': { name: '1 Timoteo', testament: 'NT', chapters: 6 },
  '2TI': { name: '2 Timoteo', testament: 'NT', chapters: 4 },
  TIT: { name: 'Tito', testament: 'NT', chapters: 3 },
  PHM: { name: 'Filemón', testament: 'NT', chapters: 1 },
  HEB: { name: 'Hebreos', testament: 'NT', chapters: 13 },
  JAS: { name: 'Santiago', testament: 'NT', chapters: 5 },
  '1PE': { name: '1 Pedro', testament: 'NT', chapters: 5 },
  '2PE': { name: '2 Pedro', testament: 'NT', chapters: 3 },
  '1JN': { name: '1 Juan', testament: 'NT', chapters: 5 },
  '2JN': { name: '2 Juan', testament: 'NT', chapters: 1 },
  '3JN': { name: '3 Juan', testament: 'NT', chapters: 1 },
  JUD: { name: 'Judas', testament: 'NT', chapters: 1 },
  REV: { name: 'Apocalipsis', testament: 'NT', chapters: 22 },
};

export interface FootnoteItem {
  id: string;
  caller: string;
  text: string;
}

export interface VerseItem {
  number: number;
  text: string;
  headings?: string[];
  footnotes?: FootnoteItem[];
}

export interface ChapterItem {
  chapter: number;
  verses: VerseItem[];
}

export interface BookItem {
  versionId: string;
  bookCode: string;
  bookName: string;
  testament: 'AT' | 'NT';
  chapters: Record<number, ChapterItem>;
}

export interface VersionManifest {
  id: string;
  name: string;
  shortName: string;
  description: string;
  language: string;
  copyright: string;
  booksCount: number;
  chaptersCount: number;
}

const VERSIONS_CONFIG: Array<{
  dirName: string;
  id: string;
  name: string;
  shortName: string;
  description: string;
  copyright: string;
}> = [
  {
    dirName: 'spaRV1909_html',
    id: 'RV1909',
    name: 'Reina Valera 1909',
    shortName: 'RV1909',
    description: 'Traducción clásica histórica en español, fiel al Texto Recibido.',
    copyright: 'Dominio Público',
  },
  {
    dirName: 'spabes_html',
    id: 'BES',
    name: 'Biblia en Español Sencillo',
    shortName: 'BES',
    description: 'Lenguaje contemporáneo accesible y directo de AudioBiblia.org.',
    copyright: 'Creative Commons Reconocimiento 4.0 Internacional (CC BY 4.0)',
  },
  {
    dirName: 'spavbl_html',
    id: 'VBL',
    name: 'Versión Biblia Libre',
    shortName: 'VBL',
    description: 'Traducción moderna y transparente con abundantes notas de estudio.',
    copyright: 'Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)',
  },
  {
    dirName: 'spapddpt_html',
    id: 'PDDPT',
    name: 'Palabra de Dios para ti',
    shortName: 'PDDPT',
    description: 'Traducción fiel y contextual de la Asociación Bíblica Latinoamericana.',
    copyright: 'Creative Commons Atribución 4.0 (CC BY 4.0)',
  },
  {
    dirName: 'spaonbv_html',
    id: 'ONBV',
    name: 'Biblica® Open Nueva Biblia Viva',
    shortName: 'ONBV',
    description: 'Paráfrasis moderna de fácil comprensión de Biblica, Inc.',
    copyright: 'Biblica, Inc. / Creative Commons',
  },
  {
    dirName: 'spabll_html',
    id: 'BLL',
    name: 'Biblia Libre Latinoamericano',
    shortName: 'BLL',
    description: 'Edición en dialecto latinoamericano de eBible.org.',
    copyright: 'Dominio Público',
  },
  {
    dirName: 'spablm_html',
    id: 'BLM',
    name: 'Biblia Libre para el Mundo',
    shortName: 'BLM',
    description: 'Edición en español europeo y global de eBible.org.',
    copyright: 'Dominio Público',
  },
];

function parseChapterHtml(html: string, fallbackChapterNum: number) {
  // Extract footnotes map from <div class="footnote">...</div>
  const footnotesMap = new Map<string, { caller: string; text: string }>();
  const fnSectionMatch = html.match(/<div class=["']footnote["']>([\s\S]*?)<\/div>/i);
  if (fnSectionMatch) {
    const fnHtml = fnSectionMatch[1];
    const fnRegex = /<p class=["']f["']\s+id=["']([^"']+)["']>([\s\S]*?)<\/p>/gi;
    let fnM;
    while ((fnM = fnRegex.exec(fnHtml)) !== null) {
      const fnId = fnM[1];
      const fnBody = fnM[2];
      const callerMatch = fnBody.match(/<span class=["']notemark["']>([^<]+)<\/span>/i);
      const textMatch = fnBody.match(/<span class=["']ft["']>([\s\S]*?)<\/span>/i);
      const caller = callerMatch ? callerMatch[1].trim() : '*';
      let text = textMatch ? textMatch[1] : fnBody;
      text = text.replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim();
      footnotesMap.set(fnId, { caller, text });
    }
  }

  // Extract main text area (exclude navigation, footnotes, copyright)
  let mainContent = html;
  const mainMatch = html.match(/<div class=["']main["']>([\s\S]*?)<\/body>/i);
  if (mainMatch) {
    mainContent = mainMatch[1];
    mainContent = mainContent.replace(/<ul class=["']tnav["']>[\s\S]*?<\/ul>/gi, '');
    mainContent = mainContent.replace(/<div class=["']footnote["']>[\s\S]*?<\/div>/gi, '');
    mainContent = mainContent.replace(/<div class=["']copyright["']>[\s\S]*?<\/div>/gi, '');
  }

  // Determine chapter number
  let chapterNum = fallbackChapterNum;
  const chapterMatch = mainContent.match(/<div class=["']chapterlabel["'][^>]*>([\s\S]*?)<\/div>/i);
  if (chapterMatch) {
    const digits = chapterMatch[1].replace(/<[^>]+>/g, '').match(/\d+/);
    if (digits) {
      chapterNum = parseInt(digits[0], 10);
    }
  }

  // Verses parsing
  const verseRegex = /<span class=["']verse["']\s+id=["']V(\d+)["']>(\d+)[^<]*<\/span>/gi;
  const matches: { index: number; verseNum: number; fullMatch: string }[] = [];
  let vMatch;
  while ((vMatch = verseRegex.exec(mainContent)) !== null) {
    matches.push({
      index: vMatch.index,
      verseNum: parseInt(vMatch[2], 10),
      fullMatch: vMatch[0],
    });
  }

  const verses: VerseItem[] = [];

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const startIndex = cur.index + cur.fullMatch.length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : mainContent.length;
    let verseChunk = mainContent.substring(startIndex, endIndex);

    // Extract headings if present in this chunk
    const headings: string[] = [];
    const headingRegex = /<div class=["'](?:s|ms|r)\d?["']>([\s\S]*?)<\/div>/gi;
    let hMatch;
    while ((hMatch = headingRegex.exec(verseChunk)) !== null) {
      const headingText = hMatch[1].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();
      if (headingText) headings.push(headingText);
    }
    verseChunk = verseChunk.replace(/<div class=["'](?:s|ms|r)\d?["']>[\s\S]*?<\/div>/gi, '');

    // Extract inline footnotes
    const verseFootnotes: FootnoteItem[] = [];
    const inlineFnRegex = /<a href=["']#([^"']+)["']\s+class=["']notemark["']>([\s\S]*?)<\/a>/gi;
    let ifnM;
    while ((ifnM = inlineFnRegex.exec(verseChunk)) !== null) {
      const fnId = ifnM[1];
      const fnObj = footnotesMap.get(fnId);
      if (fnObj) {
        verseFootnotes.push({ id: fnId, ...fnObj });
      } else {
        const popupMatch = ifnM[2].match(/<span class=["']popup["']>([\s\S]*?)<\/span>/i);
        const caller = ifnM[2].replace(/<[^>]+>/g, '').trim() || '*';
        const text = popupMatch ? popupMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        if (text) {
          verseFootnotes.push({ id: fnId, caller, text });
        }
      }
    }
    verseChunk = verseChunk.replace(/<a href=["']#[^"']+["']\s+class=["']notemark["']>[\s\S]*?<\/a>/gi, '');

    // Clean all tags and html entities
    let cleanText = verseChunk
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#8216;/g, '‘')
      .replace(/&#8217;/g, '’')
      .replace(/&#8220;/g, '“')
      .replace(/&#8221;/g, '”')
      .replace(/\s+/g, ' ')
      .trim();

    const verseObj: VerseItem = {
      number: cur.verseNum,
      text: cleanText,
    };

    if (headings.length > 0) verseObj.headings = headings;
    if (verseFootnotes.length > 0) verseObj.footnotes = verseFootnotes;

    verses.push(verseObj);
  }

  return {
    chapterNum,
    verses,
  };
}

async function runConversion() {
  console.log('🚀 Iniciando proceso de conversión de 7 versiones bíblicas HTML a JSON...');
  fs.mkdirSync(outputBaseDir, { recursive: true });

  const manifestList: VersionManifest[] = [];

  for (const config of VERSIONS_CONFIG) {
    const versionDir = path.join(sourceBaseDir, config.dirName);
    if (!fs.existsSync(versionDir)) {
      console.warn(`⚠️ Carpeta no encontrada: ${versionDir}`);
      continue;
    }

    console.log(`\n📖 Procesando versión: [${config.id}] ${config.name}...`);
    const versionOutDir = path.join(outputBaseDir, config.id);
    fs.mkdirSync(versionOutDir, { recursive: true });

    const allFiles = fs.readdirSync(versionDir);
    
    // Group files by book code (e.g. "GEN", "PSA", "1CO")
    const bookFilesMap = new Map<string, Array<{ fileName: string; chapterNum: number }>>();

    for (const file of allFiles) {
      if (!file.endsWith('.htm') && !file.endsWith('.html')) continue;

      // Match pattern like GEN01.htm, 1SA03.htm, PSA042.htm
      const m = file.match(/^([1-3]?[A-Za-z]{2,3})(\d{2,3})\.html?$/i);
      if (!m) continue;

      const bookCode = m[1].toUpperCase();
      const chapterNum = parseInt(m[2], 10);

      if (!USFM_BOOK_MAP[bookCode]) {
        // Skip extra-canonical or unknown books if any
        continue;
      }

      if (!bookFilesMap.has(bookCode)) {
        bookFilesMap.set(bookCode, []);
      }
      bookFilesMap.get(bookCode)!.push({ fileName: file, chapterNum });
    }

    let totalChaptersInVersion = 0;
    let totalBooksInVersion = 0;

    for (const [bookCode, chapterFileList] of bookFilesMap.entries()) {
      const bookMeta = USFM_BOOK_MAP[bookCode];
      // Sort chapters ascending
      chapterFileList.sort((a, b) => a.chapterNum - b.chapterNum);

      const bookData: BookItem = {
        versionId: config.id,
        bookCode,
        bookName: bookMeta.name,
        testament: bookMeta.testament,
        chapters: {},
      };

      for (const chInfo of chapterFileList) {
        const filePath = path.join(versionDir, chInfo.fileName);
        const htmlContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseChapterHtml(htmlContent, chInfo.chapterNum);

        if (parsed.verses.length > 0) {
          bookData.chapters[parsed.chapterNum] = {
            chapter: parsed.chapterNum,
            verses: parsed.verses,
          };
          totalChaptersInVersion++;
        }
      }

      const bookOutPath = path.join(versionOutDir, `${bookCode}.json`);
      fs.writeFileSync(bookOutPath, JSON.stringify(bookData, null, 2), 'utf-8');
      totalBooksInVersion++;
    }

    manifestList.push({
      id: config.id,
      name: config.name,
      shortName: config.shortName,
      description: config.description,
      language: 'es',
      copyright: config.copyright,
      booksCount: totalBooksInVersion,
      chaptersCount: totalChaptersInVersion,
    });

    console.log(`✅ [${config.id}] Convertidos con éxito: ${totalBooksInVersion} libros, ${totalChaptersInVersion} capítulos.`);
  }

  // Write manifest.json
  const manifestPath = path.join(outputBaseDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestList, null, 2), 'utf-8');

  console.log(`\n🎉 ¡Conversión finalizada exitosamente! Manifiesto generado en ${manifestPath}`);
}

runConversion().catch(console.error);
