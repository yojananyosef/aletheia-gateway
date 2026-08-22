export interface BibleBookInfo {
  code: string;
  name: string;
  testament: 'AT' | 'NT';
  chaptersCount: number;
  category: string;
  aliases: string[];
}

export const BIBLE_BOOKS_OT: BibleBookInfo[] = [
  { code: 'GEN', name: 'Génesis', testament: 'AT', chaptersCount: 50, category: 'Pentateuco', aliases: ['gen', 'genesis', 'ge'] },
  { code: 'EXO', name: 'Éxodo', testament: 'AT', chaptersCount: 40, category: 'Pentateuco', aliases: ['exo', 'exodo', 'ex'] },
  { code: 'LEV', name: 'Levítico', testament: 'AT', chaptersCount: 27, category: 'Pentateuco', aliases: ['lev', 'levitico', 'lv'] },
  { code: 'NUM', name: 'Números', testament: 'AT', chaptersCount: 36, category: 'Pentateuco', aliases: ['num', 'numeros', 'nm'] },
  { code: 'DEU', name: 'Deuteronomio', testament: 'AT', chaptersCount: 34, category: 'Pentateuco', aliases: ['deu', 'deuteronomio', 'dt'] },
  { code: 'JOS', name: 'Josué', testament: 'AT', chaptersCount: 24, category: 'Históricos', aliases: ['jos', 'josue'] },
  { code: 'JDG', name: 'Jueces', testament: 'AT', chaptersCount: 21, category: 'Históricos', aliases: ['jdg', 'jueces', 'jue'] },
  { code: 'RUT', name: 'Rut', testament: 'AT', chaptersCount: 4, category: 'Históricos', aliases: ['rut', 'rt'] },
  { code: '1SA', name: '1 Samuel', testament: 'AT', chaptersCount: 31, category: 'Históricos', aliases: ['1sa', '1 samuel', '1samuel', '1s', '1 sam'] },
  { code: '2SA', name: '2 Samuel', testament: 'AT', chaptersCount: 24, category: 'Históricos', aliases: ['2sa', '2 samuel', '2samuel', '2s', '2 sam'] },
  { code: '1KI', name: '1 Reyes', testament: 'AT', chaptersCount: 22, category: 'Históricos', aliases: ['1ki', '1 reyes', '1reyes', '1r', '1 re'] },
  { code: '2KI', name: '2 Reyes', testament: 'AT', chaptersCount: 25, category: 'Históricos', aliases: ['2ki', '2 reyes', '2reyes', '2r', '2 re'] },
  { code: '1CH', name: '1 Crónicas', testament: 'AT', chaptersCount: 29, category: 'Históricos', aliases: ['1ch', '1 cronicas', '1cronicas', '1cro', '1 cr'] },
  { code: '2CH', name: '2 Crónicas', testament: 'AT', chaptersCount: 36, category: 'Históricos', aliases: ['2ch', '2 cronicas', '2cronicas', '2cro', '2 cr'] },
  { code: 'EZR', name: 'Esdras', testament: 'AT', chaptersCount: 10, category: 'Históricos', aliases: ['ezr', 'esdras', 'esd'] },
  { code: 'NEH', name: 'Nehemías', testament: 'AT', chaptersCount: 13, category: 'Históricos', aliases: ['neh', 'nehemias', 'ne'] },
  { code: 'EST', name: 'Ester', testament: 'AT', chaptersCount: 10, category: 'Históricos', aliases: ['est', 'ester'] },
  { code: 'JOB', name: 'Job', testament: 'AT', chaptersCount: 42, category: 'Poéticos', aliases: ['job', 'jb'] },
  { code: 'PSA', name: 'Salmos', testament: 'AT', chaptersCount: 150, category: 'Poéticos', aliases: ['psa', 'salmos', 'salmo', 'sal', 'ps'] },
  { code: 'PRO', name: 'Proverbios', testament: 'AT', chaptersCount: 31, category: 'Poéticos', aliases: ['pro', 'proverbios', 'prv', 'pr'] },
  { code: 'ECC', name: 'Eclesiastés', testament: 'AT', chaptersCount: 12, category: 'Poéticos', aliases: ['ecc', 'eclesiastes', 'ecl', 'ec'] },
  { code: 'SNG', name: 'Cantares', testament: 'AT', chaptersCount: 8, category: 'Poéticos', aliases: ['sng', 'cantares', 'cantar', 'cnt'] },
  { code: 'ISA', name: 'Isaías', testament: 'AT', chaptersCount: 66, category: 'Profetas Mayores', aliases: ['isa', 'isaias', 'is'] },
  { code: 'JER', name: 'Jeremías', testament: 'AT', chaptersCount: 52, category: 'Profetas Mayores', aliases: ['jer', 'jeremias', 'jr'] },
  { code: 'LAM', name: 'Lamentaciones', testament: 'AT', chaptersCount: 5, category: 'Profetas Mayores', aliases: ['lam', 'lamentaciones', 'lm'] },
  { code: 'EZK', name: 'Ezequiel', testament: 'AT', chaptersCount: 48, category: 'Profetas Mayores', aliases: ['ezk', 'ezequiel', 'ez'] },
  { code: 'DAN', name: 'Daniel', testament: 'AT', chaptersCount: 12, category: 'Profetas Mayores', aliases: ['dan', 'daniel', 'dn'] },
  { code: 'HOS', name: 'Oseas', testament: 'AT', chaptersCount: 14, category: 'Profetas Menores', aliases: ['hos', 'oseas', 'os'] },
  { code: 'JOL', name: 'Joel', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores', aliases: ['jol', 'joel', 'jl'] },
  { code: 'AMO', name: 'Amós', testament: 'AT', chaptersCount: 9, category: 'Profetas Menores', aliases: ['amo', 'amos', 'am'] },
  { code: 'OBA', name: 'Abdías', testament: 'AT', chaptersCount: 1, category: 'Profetas Menores', aliases: ['oba', 'abdias', 'abd', 'ob'] },
  { code: 'JON', name: 'Jonás', testament: 'AT', chaptersCount: 4, category: 'Profetas Menores', aliases: ['jon', 'jonas', 'jn'] },
  { code: 'MIC', name: 'Miqueas', testament: 'AT', chaptersCount: 7, category: 'Profetas Menores', aliases: ['mic', 'miqueas', 'miq', 'mi'] },
  { code: 'NAM', name: 'Nahúm', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores', aliases: ['nam', 'nahum', 'na'] },
  { code: 'HAB', name: 'Habacuc', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores', aliases: ['hab', 'habacuc', 'hb'] },
  { code: 'ZEP', name: 'Sofonías', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores', aliases: ['zep', 'sofonias', 'sof'] },
  { code: 'HAG', name: 'Hageo', testament: 'AT', chaptersCount: 2, category: 'Profetas Menores', aliases: ['hag', 'hageo', 'hag'] },
  { code: 'MAL', name: 'Malaquías', testament: 'AT', chaptersCount: 4, category: 'Profetas Menores', aliases: ['mal', 'malaquias', 'mal'] },
  // Deuterocanónicos (presentes en traducciones como SpaPlatense)
  { code: 'TOB', name: 'Tobías', testament: 'AT', chaptersCount: 14, category: 'Deuterocanónicos', aliases: ['tob', 'tobias', 'tobit', 'tb'] },
  { code: 'JDT', name: 'Judit', testament: 'AT', chaptersCount: 16, category: 'Deuterocanónicos', aliases: ['jdt', 'judit', 'judith'] },
  { code: 'WIS', name: 'Sabiduría', testament: 'AT', chaptersCount: 19, category: 'Deuterocanónicos', aliases: ['wis', 'sabiduria', 'sab', 'sb'] },
  { code: 'SIR', name: 'Eclesiástico', testament: 'AT', chaptersCount: 51, category: 'Deuterocanónicos', aliases: ['sir', 'eclesiastico', 'siracides', 'eclo', 'si'] },
  { code: 'BAR', name: 'Baruc', testament: 'AT', chaptersCount: 6, category: 'Deuterocanónicos', aliases: ['bar', 'baruc', 'ba'] },
  { code: '1MA', name: '1 Macabeos', testament: 'AT', chaptersCount: 16, category: 'Deuterocanónicos', aliases: ['1ma', '1 macabeos', '1macabeos', '1macc', '1m'] },
  { code: '2MA', name: '2 Macabeos', testament: 'AT', chaptersCount: 15, category: 'Deuterocanónicos', aliases: ['2ma', '2 macabeos', '2macabeos', '2macc', '2m'] },
];

export const BIBLE_BOOKS_NT: BibleBookInfo[] = [
  { code: 'MAT', name: 'Mateo', testament: 'NT', chaptersCount: 28, category: 'Evangelios', aliases: ['mat', 'mateo', 'mt'] },
  { code: 'MRK', name: 'Marcos', testament: 'NT', chaptersCount: 16, category: 'Evangelios', aliases: ['mrk', 'marcos', 'mc', 'mr'] },
  { code: 'LUK', name: 'Lucas', testament: 'NT', chaptersCount: 24, category: 'Evangelios', aliases: ['luk', 'lucas', 'lc'] },
  { code: 'JHN', name: 'Juan', testament: 'NT', chaptersCount: 21, category: 'Evangelios', aliases: ['jhn', 'juan', 'jn', 'j'] },
  { code: 'ACT', name: 'Hechos', testament: 'NT', chaptersCount: 28, category: 'Histórico', aliases: ['act', 'hechos', 'hch'] },
  { code: 'ROM', name: 'Romanos', testament: 'NT', chaptersCount: 16, category: 'Epístolas Paulinas', aliases: ['rom', 'romanos', 'ro'] },
  { code: '1CO', name: '1 Corintios', testament: 'NT', chaptersCount: 16, category: 'Epístolas Paulinas', aliases: ['1co', '1 corintios', '1corintios', '1cor', '1co'] },
  { code: '2CO', name: '2 Corintios', testament: 'NT', chaptersCount: 13, category: 'Epístolas Paulinas', aliases: ['2co', '2 corintios', '2corintios', '2cor', '2co'] },
  { code: 'GAL', name: 'Gálatas', testament: 'NT', chaptersCount: 6, category: 'Epístolas Paulinas', aliases: ['gal', 'galatas', 'ga'] },
  { code: 'EPH', name: 'Efesios', testament: 'NT', chaptersCount: 6, category: 'Epístolas Paulinas', aliases: ['eph', 'efesios', 'ef'] },
  { code: 'PHP', name: 'Filipenses', testament: 'NT', chaptersCount: 4, category: 'Epístolas Paulinas', aliases: ['php', 'filipenses', 'fil', 'flp'] },
  { code: 'COL', name: 'Colosenses', testament: 'NT', chaptersCount: 4, category: 'Epístolas Paulinas', aliases: ['col', 'colosenses', 'cl'] },
  { code: '1TH', name: '1 Tesalonicenses', testament: 'NT', chaptersCount: 5, category: 'Epístolas Paulinas', aliases: ['1th', '1 tesalonicenses', '1tesalonicenses', '1ts', '1tes'] },
  { code: '2TH', name: '2 Tesalonicenses', testament: 'NT', chaptersCount: 3, category: 'Epístolas Paulinas', aliases: ['2th', '2 tesalonicenses', '2tesalonicenses', '2ts', '2tes'] },
  { code: '1TI', name: '1 Timoteo', testament: 'NT', chaptersCount: 6, category: 'Epístolas Pastorales', aliases: ['1ti', '1 timoteo', '1timoteo', '1tm', '1tim'] },
  { code: '2TI', name: '2 Timoteo', testament: 'NT', chaptersCount: 4, category: 'Epístolas Pastorales', aliases: ['2ti', '2 timoteo', '2timoteo', '2tm', '2tim'] },
  { code: 'TIT', name: 'Tito', testament: 'NT', chaptersCount: 3, category: 'Epístolas Pastorales', aliases: ['tit', 'tito', 'tt'] },
  { code: 'PHM', name: 'Filemón', testament: 'NT', chaptersCount: 1, category: 'Epístolas Paulinas', aliases: ['phm', 'filemon', 'flm'] },
  { code: 'HEB', name: 'Hebreos', testament: 'NT', chaptersCount: 13, category: 'Epístolas Generales', aliases: ['heb', 'hebreos', 'he'] },
  { code: 'JAS', name: 'Santiago', testament: 'NT', chaptersCount: 5, category: 'Epístolas Generales', aliases: ['jas', 'santiago', 'stg', 'st'] },
  { code: '1PE', name: '1 Pedro', testament: 'NT', chaptersCount: 5, category: 'Epístolas Generales', aliases: ['1pe', '1 pedro', '1pedro', '1p', '1ped'] },
  { code: '2PE', name: '2 Pedro', testament: 'NT', chaptersCount: 3, category: 'Epístolas Generales', aliases: ['2pe', '2 pedro', '2pedro', '2p', '2ped'] },
  { code: '1JN', name: '1 Juan', testament: 'NT', chaptersCount: 5, category: 'Epístolas Generales', aliases: ['1jn', '1 juan', '1juan', '1j'] },
  { code: '2JN', name: '2 Juan', testament: 'NT', chaptersCount: 1, category: 'Epístolas Generales', aliases: ['2jn', '2 juan', '2juan', '2j'] },
  { code: '3JN', name: '3 Juan', testament: 'NT', chaptersCount: 1, category: 'Epístolas Generales', aliases: ['3jn', '3 juan', '3juan', '3j'] },
  { code: 'JUD', name: 'Judas', testament: 'NT', chaptersCount: 1, category: 'Epístolas Generales', aliases: ['jud', 'judas', 'jd'] },
  { code: 'REV', name: 'Apocalipsis', testament: 'NT', chaptersCount: 22, category: 'Profético', aliases: ['rev', 'apocalipsis', 'apoc', 'ap'] },
];

export const ALL_BIBLE_BOOKS: BibleBookInfo[] = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];

const normalize = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

export function findBookInfo(bookNameOrCode: string): BibleBookInfo | undefined {
  const query = normalize(bookNameOrCode);
  return ALL_BIBLE_BOOKS.find((b) => {
    if (b.code.toLowerCase() === query) return true;
    if (normalize(b.name) === query) return true;
    if (b.aliases.some((a) => normalize(a) === query)) return true;
    return false;
  }) || ALL_BIBLE_BOOKS.find((b) => normalize(b.name).startsWith(query));
}
