export interface BibleBookInfo {
  name: string;
  testament: 'AT' | 'NT';
  chaptersCount: number;
  category: string;
}

export const BIBLE_BOOKS_OT: BibleBookInfo[] = [
  { name: 'Génesis', testament: 'AT', chaptersCount: 50, category: 'Pentateuco' },
  { name: 'Éxodo', testament: 'AT', chaptersCount: 40, category: 'Pentateuco' },
  { name: 'Levítico', testament: 'AT', chaptersCount: 27, category: 'Pentateuco' },
  { name: 'Números', testament: 'AT', chaptersCount: 36, category: 'Pentateuco' },
  { name: 'Deuteronomio', testament: 'AT', chaptersCount: 34, category: 'Pentateuco' },
  { name: 'Josué', testament: 'AT', chaptersCount: 24, category: 'Históricos' },
  { name: 'Jueces', testament: 'AT', chaptersCount: 21, category: 'Históricos' },
  { name: 'Rut', testament: 'AT', chaptersCount: 4, category: 'Históricos' },
  { name: '1 Samuel', testament: 'AT', chaptersCount: 31, category: 'Históricos' },
  { name: '2 Samuel', testament: 'AT', chaptersCount: 24, category: 'Históricos' },
  { name: '1 Reyes', testament: 'AT', chaptersCount: 22, category: 'Históricos' },
  { name: '2 Reyes', testament: 'AT', chaptersCount: 25, category: 'Históricos' },
  { name: '1 Crónicas', testament: 'AT', chaptersCount: 29, category: 'Históricos' },
  { name: '2 Crónicas', testament: 'AT', chaptersCount: 36, category: 'Históricos' },
  { name: 'Esdras', testament: 'AT', chaptersCount: 10, category: 'Históricos' },
  { name: 'Nehemías', testament: 'AT', chaptersCount: 13, category: 'Históricos' },
  { name: 'Ester', testament: 'AT', chaptersCount: 10, category: 'Históricos' },
  { name: 'Job', testament: 'AT', chaptersCount: 42, category: 'Poéticos' },
  { name: 'Salmos', testament: 'AT', chaptersCount: 150, category: 'Poéticos' },
  { name: 'Proverbios', testament: 'AT', chaptersCount: 31, category: 'Poéticos' },
  { name: 'Eclesiastés', testament: 'AT', chaptersCount: 12, category: 'Poéticos' },
  { name: 'Cantares', testament: 'AT', chaptersCount: 8, category: 'Poéticos' },
  { name: 'Isaías', testament: 'AT', chaptersCount: 66, category: 'Profetas Mayores' },
  { name: 'Jeremías', testament: 'AT', chaptersCount: 52, category: 'Profetas Mayores' },
  { name: 'Lamentaciones', testament: 'AT', chaptersCount: 5, category: 'Profetas Mayores' },
  { name: 'Ezequiel', testament: 'AT', chaptersCount: 48, category: 'Profetas Mayores' },
  { name: 'Daniel', testament: 'AT', chaptersCount: 12, category: 'Profetas Mayores' },
  { name: 'Oseas', testament: 'AT', chaptersCount: 14, category: 'Profetas Menores' },
  { name: 'Joel', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores' },
  { name: 'Amós', testament: 'AT', chaptersCount: 9, category: 'Profetas Menores' },
  { name: 'Abdías', testament: 'AT', chaptersCount: 1, category: 'Profetas Menores' },
  { name: 'Jonás', testament: 'AT', chaptersCount: 4, category: 'Profetas Menores' },
  { name: 'Miqueas', testament: 'AT', chaptersCount: 7, category: 'Profetas Menores' },
  { name: 'Nahúm', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores' },
  { name: 'Habacuc', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores' },
  { name: 'Sofonías', testament: 'AT', chaptersCount: 3, category: 'Profetas Menores' },
  { name: 'Hageo', testament: 'AT', chaptersCount: 2, category: 'Profetas Menores' },
  { name: 'Zacarías', testament: 'AT', chaptersCount: 14, category: 'Profetas Menores' },
  { name: 'Malaquías', testament: 'AT', chaptersCount: 4, category: 'Profetas Menores' },
];

export const BIBLE_BOOKS_NT: BibleBookInfo[] = [
  { name: 'Mateo', testament: 'NT', chaptersCount: 28, category: 'Evangelios' },
  { name: 'Marcos', testament: 'NT', chaptersCount: 16, category: 'Evangelios' },
  { name: 'Lucas', testament: 'NT', chaptersCount: 24, category: 'Evangelios' },
  { name: 'Juan', testament: 'NT', chaptersCount: 21, category: 'Evangelios' },
  { name: 'Hechos', testament: 'NT', chaptersCount: 28, category: 'Histórico' },
  { name: 'Romanos', testament: 'NT', chaptersCount: 16, category: 'Epístolas Paulinas' },
  { name: '1 Corintios', testament: 'NT', chaptersCount: 16, category: 'Epístolas Paulinas' },
  { name: '2 Corintios', testament: 'NT', chaptersCount: 13, category: 'Epístolas Paulinas' },
  { name: 'Gálatas', testament: 'NT', chaptersCount: 6, category: 'Epístolas Paulinas' },
  { name: 'Efesios', testament: 'NT', chaptersCount: 6, category: 'Epístolas Paulinas' },
  { name: 'Filipenses', testament: 'NT', chaptersCount: 4, category: 'Epístolas Paulinas' },
  { name: 'Colosenses', testament: 'NT', chaptersCount: 4, category: 'Epístolas Paulinas' },
  { name: '1 Tesalonicenses', testament: 'NT', chaptersCount: 5, category: 'Epístolas Paulinas' },
  { name: '2 Tesalonicenses', testament: 'NT', chaptersCount: 3, category: 'Epístolas Paulinas' },
  { name: '1 Timoteo', testament: 'NT', chaptersCount: 6, category: 'Epístolas Pastorales' },
  { name: '2 Timoteo', testament: 'NT', chaptersCount: 4, category: 'Epístolas Pastorales' },
  { name: 'Tito', testament: 'NT', chaptersCount: 3, category: 'Epístolas Pastorales' },
  { name: 'Filemón', testament: 'NT', chaptersCount: 1, category: 'Epístolas Paulinas' },
  { name: 'Hebreos', testament: 'NT', chaptersCount: 13, category: 'Epístolas Generales' },
  { name: 'Santiago', testament: 'NT', chaptersCount: 5, category: 'Epístolas Generales' },
  { name: '1 Pedro', testament: 'NT', chaptersCount: 5, category: 'Epístolas Generales' },
  { name: '2 Pedro', testament: 'NT', chaptersCount: 3, category: 'Epístolas Generales' },
  { name: '1 Juan', testament: 'NT', chaptersCount: 5, category: 'Epístolas Generales' },
  { name: '2 Juan', testament: 'NT', chaptersCount: 1, category: 'Epístolas Generales' },
  { name: '3 Juan', testament: 'NT', chaptersCount: 1, category: 'Epístolas Generales' },
  { name: 'Judas', testament: 'NT', chaptersCount: 1, category: 'Epístolas Generales' },
  { name: 'Apocalipsis', testament: 'NT', chaptersCount: 22, category: 'Profético' },
];

export const ALL_BIBLE_BOOKS: BibleBookInfo[] = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];

export function findBookInfo(bookName: string): BibleBookInfo | undefined {
  const norm = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
  const searchNorm = norm(bookName);
  return ALL_BIBLE_BOOKS.find((b) => norm(b.name) === searchNorm || norm(b.name).startsWith(searchNorm));
}
