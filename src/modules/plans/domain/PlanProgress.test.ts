import { describe, expect, it } from 'vitest';
import { completedPlanDays, isPlanDayCompleted, planProgress, togglePlanDay } from './PlanProgress';

describe('PlanProgress domain', () => {
  it('marca y desmarca días sin duplicar', () => {
    let p = togglePlanDay({}, 'daniel', 1);
    expect(isPlanDayCompleted(p, 'daniel', 1)).toBe(true);
    p = togglePlanDay(p, 'DANIEL', 2);
    expect(completedPlanDays(p, 'daniel')).toBe(2);
    p = togglePlanDay(p, 'daniel', 1);
    expect(isPlanDayCompleted(p, 'daniel', 1)).toBe(false);
    expect(completedPlanDays(p, 'daniel')).toBe(1);
  });

  it('ignora ids vacíos y días inválidos', () => {
    expect(togglePlanDay({}, '', 1)).toEqual({});
    expect(togglePlanDay({}, 'daniel', 0)).toEqual({});
    expect(togglePlanDay({}, 'daniel', 1.5)).toEqual({});
    expect(planProgress({}, 'daniel', 0)).toBe(0);
    expect(isPlanDayCompleted({}, '', 1)).toBe(false);
  });

  it('calcula el porcentaje sobre el total del plan', () => {
    let p = togglePlanDay({}, 'daniel', 1);
    p = togglePlanDay(p, 'daniel', 2);
    expect(planProgress(p, 'daniel', 16)).toBe(12.5);
    expect(planProgress(p, 'daniel', 2)).toBe(100);
    // Días fuera de rango no cuentan
    const dirty = { daniel: [1, 2, 99] };
    expect(planProgress(dirty, 'daniel', 16)).toBe(12.5);
  });
});
