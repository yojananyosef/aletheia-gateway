export interface DailyVerseEntry {
  day: number; // 1 to 366
  reference: string;
  topic?: string;
}

// 366 curated key scripture verses for every day of the calendar year
export const DAILY_VERSES_366: string[] = [
  'Génesis 1:1', 'Josué 1:9', 'Salmos 23:1', 'Proverbios 3:5-6', 'Isaías 40:31',
  'Jeremías 29:11', 'Mateo 6:33', 'Juan 3:16', 'Romanos 8:28', 'Filipenses 4:13',
  'Salmos 46:1', 'Proverbios 16:3', 'Isaías 41:10', 'Mateo 11:28', 'Juan 14:6',
  'Romanos 12:2', '1 Corintios 13:4-7', '2 Corintios 5:17', 'Gálatas 5:22-23', 'Efesios 2:8-9',
  'Filipenses 4:6-7', 'Colosenses 3:12', '1 Tesalonicenses 5:16-18', '2 Timoteo 1:7', 'Hebreos 11:1',
  'Santiago 1:5', '1 Pedro 5:7', '1 Juan 4:19', 'Apocalipsis 21:4', 'Salmos 1:1-2',
  'Salmos 19:14', 'Salmos 27:1', 'Salmos 34:8', 'Salmos 37:4', 'Salmos 51:10',
  'Salmos 91:1-2', 'Salmos 103:1-2', 'Salmos 118:24', 'Salmos 119:105', 'Salmos 121:1-2',
  'Salmos 139:14', 'Proverbios 4:23', 'Proverbios 18:10', 'Proverbios 27:17', 'Eclesiastés 3:1',
  'Isaías 9:6', 'Isaías 26:3', 'Isaías 43:2', 'Isaías 53:5', 'Isaías 55:8-9',
  'Lamentaciones 3:22-23', 'Miqueas 6:8', 'Sofonías 3:17', 'Habacuc 3:17-18', 'Malaquías 3:10',
  'Mateo 5:14-16', 'Mateo 7:7', 'Mateo 28:19-20', 'Marcos 10:45', 'Marcos 11:24',
  'Lucas 1:37', 'Lucas 6:31', 'Lucas 12:32', 'Juan 1:1', 'Juan 1:12',
  'Juan 8:12', 'Juan 10:10', 'Juan 11:25', 'Juan 13:34-35', 'Juan 14:27',
  'Juan 15:5', 'Juan 16:33', 'Hechos 1:8', 'Hechos 4:12', 'Hechos 16:31',
  'Romanos 1:16', 'Romanos 3:23', 'Romanos 5:8', 'Romanos 6:23', 'Romanos 8:1',
  'Romanos 8:38-39', 'Romanos 10:9', 'Romanos 12:12', 'Romanos 15:13', '1 Corintios 10:13',
  '1 Corintios 15:58', '1 Corintios 16:14', '2 Corintios 4:16-18', '2 Corintios 12:9', 'Gálatas 2:20',
  'Gálatas 6:9', 'Efesios 4:32', 'Efesios 6:10-11', 'Filipenses 1:6', 'Filipenses 2:3-4',
  'Filipenses 4:19', 'Colosenses 3:15', 'Colosenses 3:23', '1 Tesalonicenses 5:11', '1 Timoteo 6:12',
  '2 Timoteo 3:16-17', 'Hebreos 4:12', 'Hebreos 4:16', 'Hebreos 10:24-25', 'Hebreos 12:1-2',
  'Hebreos 13:8', 'Santiago 1:2-3', 'Santiago 4:7-8', 'Santiago 5:16', '1 Pedro 1:3',
  '1 Pedro 2:9', '1 Pedro 3:15', '2 Pedro 3:9', '1 Juan 1:9', '1 Juan 3:1',
  '1 Juan 4:7-8', '1 Juan 5:14-15', 'Judas 1:24-25', 'Apocalipsis 3:20', 'Apocalipsis 22:13',
  'Salmos 8:1', 'Salmos 16:11', 'Salmos 25:4-5', 'Salmos 32:8', 'Salmos 40:1-2',
  'Salmos 42:1-2', 'Salmos 42:8', 'Salmos 62:1-2', 'Salmos 63:1', 'Salmos 84:10',
  'Salmos 90:12', 'Salmos 100:1-3', 'Salmos 107:1', 'Salmos 116:12', 'Salmos 130:5',
  'Salmos 133:1', 'Salmos 138:8', 'Salmos 145:9', 'Salmos 147:3', 'Proverbios 1:7',
  'Proverbios 15:1', 'Proverbios 17:17', 'Proverbios 19:21', 'Proverbios 22:1', 'Proverbios 31:30',
  'Cantares 2:16', 'Isaías 1:18', 'Isaías 6:8', 'Isaías 12:2', 'Isaías 30:15',
  'Isaías 40:29', 'Isaías 49:15-16', 'Isaías 54:10', 'Isaías 58:11', 'Isaías 60:1',
  'Jeremías 1:5', 'Jeremías 17:7-8', 'Jeremías 31:3', 'Jeremías 32:27', 'Jeremías 33:3',
  'Ezequiel 36:26', 'Daniel 2:20-22', 'Daniel 12:3', 'Oseas 6:6', 'Joel 2:28',
  'Amós 5:24', 'Jonás 2:9', 'Miqueas 7:18', 'Nahúm 1:7', 'Hageo 2:9',
  'Zacarías 4:6', 'Zacarías 9:9', 'Mateo 5:3-10', 'Mateo 6:9-13', 'Mateo 6:21',
  'Mateo 7:12', 'Mateo 10:29-31', 'Mateo 18:20', 'Mateo 19:26', 'Mateo 22:37-39',
  'Marcos 8:36', 'Marcos 9:23', 'Marcos 12:30', 'Marcos 13:31', 'Marcos 16:15',
  'Lucas 2:10-11', 'Lucas 9:23', 'Lucas 10:27', 'Lucas 11:9-10', 'Lucas 15:7',
  'Lucas 18:1', 'Lucas 19:10', 'Lucas 23:34', 'Lucas 24:32', 'Juan 3:3',
  'Juan 4:24', 'Juan 5:24', 'Juan 6:35', 'Juan 7:37-38', 'Juan 8:31-32',
  'Juan 10:27-28', 'Juan 12:26', 'Juan 14:1-3', 'Juan 14:15', 'Juan 15:12-13',
  'Juan 17:3', 'Juan 20:29', 'Juan 20:31', 'Hechos 2:38', 'Hechos 2:42',
  'Hechos 3:19', 'Hechos 10:34-35', 'Hechos 17:28', 'Hechos 20:24', 'Hechos 20:35',
  'Romanos 5:1-2', 'Romanos 6:11', 'Romanos 8:14', 'Romanos 8:18', 'Romanos 8:31',
  'Romanos 8:37', 'Romanos 11:33', 'Romanos 12:9-10', 'Romanos 12:18', 'Romanos 12:21',
  'Romanos 14:8', '1 Corintios 1:18', '1 Corintios 2:9', '1 Corintios 3:16', '1 Corintios 6:19-20',
  '1 Corintios 9:24', '1 Corintios 13:13', '1 Corintios 15:57', '2 Corintios 1:3-4', '2 Corintios 3:17',
  '2 Corintios 4:7', '2 Corintios 5:21', '2 Corintios 9:7', '2 Corintios 9:8', '2 Corintios 13:14',
  'Gálatas 3:28', 'Gálatas 5:1', 'Gálatas 5:13', 'Gálatas 6:2', 'Gálatas 6:7-8',
  'Efesios 1:3', 'Efesios 2:10', 'Efesios 3:20-21', 'Efesios 4:1-3', 'Efesios 4:26',
  'Efesios 5:1-2', 'Efesios 5:15-16', 'Efesios 6:18', 'Filipenses 1:21', 'Filipenses 2:5-8',
  'Filipenses 2:13', 'Filipenses 3:13-14', 'Filipenses 4:4', 'Filipenses 4:8', 'Filipenses 4:11-12',
  'Colosenses 1:16-17', 'Colosenses 2:6-7', 'Colosenses 3:1-2', 'Colosenses 3:16', 'Colosenses 4:6',
  '1 Tesalonicenses 4:11', '1 Tesalonicenses 5:23-24', '2 Tesalonicenses 3:3', '2 Tesalonicenses 3:16', '1 Timoteo 1:15',
  '1 Timoteo 2:5', '1 Timoteo 4:12', '1 Timoteo 6:6-7', '2 Timoteo 1:9', '2 Timoteo 2:15',
  '2 Timoteo 4:7-8', 'Tito 2:11-12', 'Tito 3:4-5', 'Filemón 1:7', 'Hebreos 2:18',
  'Hebreos 3:13', 'Hebreos 6:19', 'Hebreos 9:28', 'Hebreos 10:22', 'Hebreos 11:6',
  'Hebreos 12:14', 'Hebreos 13:5-6', 'Hebreos 13:15-16', 'Santiago 1:12', 'Santiago 1:17',
  'Santiago 1:19-20', 'Santiago 1:22', 'Santiago 3:17', 'Santiago 4:10', 'Santiago 5:13',
  '1 Pedro 1:22', '1 Pedro 2:24', '1 Pedro 3:8-9', '1 Pedro 4:8', '1 Pedro 5:10',
  '2 Pedro 1:3-4', '2 Pedro 1:5-7', '2 Pedro 3:18', '1 Juan 1:7', '1 Juan 2:1-2',
  '1 Juan 2:15-17', '1 Juan 3:16', '1 Juan 3:18', '1 Juan 4:4', '1 Juan 4:16',
  '1 Juan 5:4', '1 Juan 5:11-12', '1 Juan 5:20', '2 Juan 1:6', '3 Juan 1:2',
  'Judas 1:20-21', 'Apocalipsis 1:8', 'Apocalipsis 3:8', 'Apocalipsis 7:16-17', 'Apocalipsis 19:6-7',
  'Apocalipsis 21:3', 'Apocalipsis 21:6', 'Apocalipsis 22:17', 'Apocalipsis 22:20', 'Salmos 150:6'
];

/**
 * Returns the 0-indexed day of the year (0 to 365).
 */
export function getDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return Math.max(0, day - 1);
}

/**
 * Formats date into Spanish readable string (ej. "21 de agosto de 2026").
 */
export function formatSpanishDate(date = new Date()): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Returns today's unique Daily Verse reference.
 */
export function getTodayVerseReference(date = new Date()): { dayIndex: number; dateFormatted: string; reference: string } {
  const dayIndex = getDayOfYear(date) % DAILY_VERSES_366.length;
  const reference = DAILY_VERSES_366[dayIndex];
  const dateFormatted = formatSpanishDate(date);
  return { dayIndex, dateFormatted, reference };
}
