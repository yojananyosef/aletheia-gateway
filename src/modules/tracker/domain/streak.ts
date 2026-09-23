/**
 * Racha de lectura diaria (port puro de NRVA `useStreak.ts`).
 * Sin DOM ni localStorage: el repositorio persiste, aquí solo cálculo.
 * Fechas en hora local como `YYYY-MM-DD`.
 */

export interface StreakData {
  currentStreak: number;
  lastVisit: string;
  visitHistory: string[];
  yearlyVisits: Record<string, number>;
  bestStreak: number;
}

export interface WeeklyProgress {
  currentStreak: number;
  /** Domingo (0) a sábado (6). */
  daysVisited: boolean[];
  todayIndex: number;
  totalDaysThisYear: number;
  weeksStreak: number;
  bestStreak: number;
}

export const EMPTY_STREAK: StreakData = {
  currentStreak: 0,
  lastVisit: '',
  visitHistory: [],
  yearlyVisits: {},
  bestStreak: 0,
};

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDay(dayStr: string): Date {
  const [y, m, d] = dayStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(dayStr: string, n: number): string {
  const d = parseDay(dayStr);
  d.setDate(d.getDate() + n);
  return getLocalDateString(d);
}

export function calculateBestStreak(history: string[]): number {
  if (!history || history.length === 0) return 0;
  const sorted = [...new Set(history)].sort();
  let maxStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round((parseDay(sorted[i]).getTime() - parseDay(sorted[i - 1]).getTime()) / 86400000);
    if (diffDays === 1) run++;
    else if (diffDays > 1) run = 1;
    if (run > maxStreak) maxStreak = run;
  }
  return maxStreak;
}

function sanitize(data: Partial<StreakData>): StreakData {
  const visitHistory = Array.isArray(data.visitHistory) ? [...new Set(data.visitHistory)] : [];
  const yearlyVisits = data.yearlyVisits && typeof data.yearlyVisits === 'object' ? { ...data.yearlyVisits } : {};
  return {
    currentStreak: Number(data.currentStreak) || 0,
    lastVisit: typeof data.lastVisit === 'string' ? data.lastVisit : '',
    visitHistory,
    yearlyVisits,
    bestStreak: Number(data.bestStreak) || 0,
  };
}

/** Registra la visita de `today`. Idempotente dentro del mismo día. */
export function recordVisit(raw: Partial<StreakData>, today: string): StreakData {
  const data = sanitize(raw);
  if (data.bestStreak === 0) data.bestStreak = calculateBestStreak(data.visitHistory);
  if (data.lastVisit === today) {
    if (data.currentStreak > data.bestStreak) data.bestStreak = data.currentStreak;
    return data;
  }
  const year = today.slice(0, 4);
  data.currentStreak = data.lastVisit === addDays(today, -1) ? data.currentStreak + 1 : 1;
  if (data.currentStreak > data.bestStreak) data.bestStreak = data.currentStreak;
  data.lastVisit = today;
  if (!data.visitHistory.includes(today)) {
    data.visitHistory.push(today);
    data.yearlyVisits[year] = (data.yearlyVisits[year] || 0) + 1;
  }
  if (data.visitHistory.length > 60) data.visitHistory = data.visitHistory.slice(-60);
  return data;
}

export function weeklyProgress(raw: Partial<StreakData>, now: Date = new Date()): WeeklyProgress {
  const data = sanitize(raw);
  const today = getLocalDateString(now);
  const todayIndex = now.getDay();
  const daysVisited = [false, false, false, false, false, false, false];
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - todayIndex);
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    if (data.visitHistory.includes(getLocalDateString(day))) daysVisited[i] = true;
  }
  let weeksStreak = 0;
  if (data.currentStreak > 0) {
    const start = parseDay(addDays(today, -(data.currentStreak - 1)));
    const startSunday = new Date(start);
    startSunday.setDate(start.getDate() - start.getDay());
    startSunday.setHours(0, 0, 0, 0);
    const endSunday = new Date(now);
    endSunday.setDate(now.getDate() - now.getDay());
    endSunday.setHours(0, 0, 0, 0);
    weeksStreak = Math.round(Math.abs(endSunday.getTime() - startSunday.getTime()) / 604800000) + 1;
  }
  const year = String(now.getFullYear());
  return {
    currentStreak: data.currentStreak,
    daysVisited,
    todayIndex,
    totalDaysThisYear: data.yearlyVisits[year] ?? (data.visitHistory.includes(today) ? 1 : 0),
    weeksStreak,
    bestStreak: data.bestStreak || data.currentStreak,
  };
}
