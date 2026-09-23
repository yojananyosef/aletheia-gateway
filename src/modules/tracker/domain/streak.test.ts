import { describe, expect, it } from 'vitest';
import { addDays, calculateBestStreak, EMPTY_STREAK, getLocalDateString, recordVisit, weeklyProgress } from './streak';

describe('streak', () => {
  it('formatea fecha local YYYY-MM-DD', () => {
    expect(getLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('primera visita inicia racha en 1', () => {
    const d = recordVisit(EMPTY_STREAK, '2026-09-23');
    expect(d.currentStreak).toBe(1);
    expect(d.bestStreak).toBe(1);
    expect(d.visitHistory).toEqual(['2026-09-23']);
    expect(d.yearlyVisits).toEqual({ '2026': 1 });
  });

  it('visita consecutiva suma, salto reinicia', () => {
    let d = recordVisit(EMPTY_STREAK, '2026-09-23');
    d = recordVisit(d, '2026-09-24');
    expect(d.currentStreak).toBe(2);
    d = recordVisit(d, '2026-09-26');
    expect(d.currentStreak).toBe(1);
    expect(d.bestStreak).toBe(2);
  });

  it('mismo día es idempotente', () => {
    let d = recordVisit(EMPTY_STREAK, '2026-09-23');
    d = recordVisit(d, '2026-09-23');
    expect(d.currentStreak).toBe(1);
    expect(d.visitHistory).toHaveLength(1);
  });

  it('calculateBestStreak detecta la mejor racha con huecos', () => {
    expect(calculateBestStreak([])).toBe(0);
    expect(calculateBestStreak(['2026-09-20', '2026-09-21', '2026-09-23', '2026-09-24', '2026-09-25'])).toBe(3);
  });

  it('weeklyProgress marca la semana actual (domingo a sábado)', () => {
    // Miércoles 2026-09-23 con visitas lunes..miércoles
    const d = recordVisit(recordVisit(recordVisit(EMPTY_STREAK, '2026-09-21'), '2026-09-22'), '2026-09-23');
    const w = weeklyProgress(d, new Date(2026, 8, 23, 12));
    expect(w.todayIndex).toBe(3);
    expect(w.daysVisited).toEqual([false, true, true, true, false, false, false]);
    expect(w.currentStreak).toBe(3);
    expect(w.totalDaysThisYear).toBe(3);
  });
});
