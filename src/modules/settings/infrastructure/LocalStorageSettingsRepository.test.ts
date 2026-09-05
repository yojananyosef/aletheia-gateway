import { afterEach, describe, expect, it } from 'vitest';
import { LocalStorageSettingsRepository } from './LocalStorageSettingsRepository';
import { BOOKMARKS_STORAGE_KEY } from '../../bookmarks/infrastructure/LocalStorageBookmarkRepository';
import { PERSONAL_NOTES_STORAGE_KEY } from '../../notes/infrastructure/LocalStorageNoteRepository';
import { installMemoryStorage, uninstallStorage } from '../../../test-utils';

afterEach(() => {
  uninstallStorage();
});

describe('LocalStorageSettingsRepository backup keys', () => {
  it('exportBackup reads bookmarks and notes from the canonical repo keys', async () => {
    const store = installMemoryStorage({
      [BOOKMARKS_STORAGE_KEY]: JSON.stringify([{ id: 'b1', reference: 'Juan 3:16' }]),
      [PERSONAL_NOTES_STORAGE_KEY]: JSON.stringify([{ id: 'n1', reference: 'Gen 1:1' }]),
    });
    const repo = new LocalStorageSettingsRepository();
    const payload = JSON.parse(await repo.exportBackup());
    expect(payload.data.bookmarks).toHaveLength(1);
    expect(payload.data.notes).toHaveLength(1);
    expect(store.dump()[BOOKMARKS_STORAGE_KEY]).toBeDefined();
  });

  it('exportBackup rescues data orphaned under pre-v0.11.2 backup keys', async () => {
    installMemoryStorage({
      alethia_bookmarks_v1: JSON.stringify([{ id: 'b9', reference: 'Sal 23' }]),
      alethia_notes_v1: JSON.stringify([{ id: 'n9', reference: 'Rom 8:28' }]),
    });
    const repo = new LocalStorageSettingsRepository();
    const payload = JSON.parse(await repo.exportBackup());
    expect(payload.data.bookmarks).toHaveLength(1);
    expect(payload.data.notes).toHaveLength(1);
  });

  it('importBackup writes to the canonical keys read by the repos', async () => {
    const store = installMemoryStorage({});
    const repo = new LocalStorageSettingsRepository();
    const result = await repo.importBackup(
      JSON.stringify({
        data: {
          bookmarks: [{ id: 'b2' }],
          notes: [{ id: 'n2' }],
          highlights: [],
        },
      }),
    );
    expect(result.success).toBe(true);
    expect(JSON.parse(store.dump()[BOOKMARKS_STORAGE_KEY])).toHaveLength(1);
    expect(JSON.parse(store.dump()[PERSONAL_NOTES_STORAGE_KEY])).toHaveLength(1);
  });

  it('resetAllData clears the canonical keys', () => {
    const store = installMemoryStorage({
      [BOOKMARKS_STORAGE_KEY]: '[]',
      [PERSONAL_NOTES_STORAGE_KEY]: '[]',
      aletheia_user_settings: '{}',
    });
    new LocalStorageSettingsRepository().resetAllData();
    expect(store.dump()).toEqual({});
  });
});
