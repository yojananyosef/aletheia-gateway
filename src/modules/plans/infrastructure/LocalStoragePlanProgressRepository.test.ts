import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLAN_PROGRESS_STORAGE_KEY, LocalStoragePlanProgressRepository } from './LocalStoragePlanProgressRepository';
import { installMemoryStorage, uninstallStorage } from '../../../test-utils';

beforeEach(() => {
  installMemoryStorage({});
});

afterEach(() => {
  uninstallStorage();
});

describe('LocalStoragePlanProgressRepository', () => {
  it('persiste días completados por plan', async () => {
    const repo = new LocalStoragePlanProgressRepository();
    repo.toggleDay('daniel', 1);
    repo.toggleDay('daniel', 2);
    repo.toggleDay('apocalipsis', 1);
    expect(repo.isDayCompleted('daniel', 1)).toBe(true);
    expect(repo.isDayCompleted('daniel', 3)).toBe(false);
    expect(repo.getProgress()).toEqual({ daniel: [1, 2], apocalipsis: [1] });
  });

  it('el segundo toggle desmarca', () => {
    const repo = new LocalStoragePlanProgressRepository();
    repo.toggleDay('daniel', 1);
    repo.toggleDay('daniel', 1);
    expect(repo.isDayCompleted('daniel', 1)).toBe(false);
  });

  it('resetPlan borra solo ese plan', () => {
    const store = installMemoryStorage({
      [PLAN_PROGRESS_STORAGE_KEY]: JSON.stringify({ daniel: [1], apocalipsis: [1, 2] }),
    });
    const repo = new LocalStoragePlanProgressRepository();
    repo.resetPlan('daniel');
    expect(JSON.parse(store.dump()[PLAN_PROGRESS_STORAGE_KEY])).toEqual({ apocalipsis: [1, 2] });
  });

  it('tolera JSON corrupto', () => {
    installMemoryStorage({ [PLAN_PROGRESS_STORAGE_KEY]: 'roto{{{' });
    const repo = new LocalStoragePlanProgressRepository();
    expect(repo.getProgress()).toEqual({});
  });
});
