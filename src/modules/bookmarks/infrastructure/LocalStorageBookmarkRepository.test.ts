import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOOKMARKS_STORAGE_KEY, LocalStorageBookmarkRepository } from './LocalStorageBookmarkRepository';
import { installMemoryStorage, uninstallStorage } from '../../../test-utils';

beforeEach(() => {
  vi.stubGlobal('window', {});
  installMemoryStorage({});
});

afterEach(() => {
  uninstallStorage();
  vi.unstubAllGlobals();
});

function payload() {
  return {
    reference: 'Génesis 1:1',
    book: 'Génesis',
    chapter: 1,
    translationId: 'RV1909',
    previewText: 'En el principio creó Dios...',
  };
}

describe('LocalStorageBookmarkRepository', () => {
  it('guarda y lista marcadores con id y fecha', async () => {
    const repo = new LocalStorageBookmarkRepository();
    const saved = await repo.save(payload());
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(await repo.getAll()).toHaveLength(1);
    expect(await repo.isBookmarked('Génesis 1:1')).toBe(true);
    expect(await repo.isBookmarked('Éxodo 1:1')).toBe(false);
  });

  it('no duplica la misma referencia: la actualiza', async () => {
    const repo = new LocalStorageBookmarkRepository();
    await repo.save(payload());
    await repo.save({ ...payload(), previewText: 'Texto actualizado' });
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].previewText).toBe('Texto actualizado');
  });

  it('elimina por id o por referencia', async () => {
    const repo = new LocalStorageBookmarkRepository();
    const saved = await repo.save(payload());
    await repo.remove(saved.id);
    expect(await repo.getAll()).toHaveLength(0);
    await repo.save(payload());
    await repo.remove('Génesis 1:1');
    expect(await repo.getAll()).toHaveLength(0);
  });

  it('devuelve [] con JSON corrupto en vez de romper', async () => {
    const store = installMemoryStorage({ [BOOKMARKS_STORAGE_KEY]: 'no-json{{{' });
    const repo = new LocalStorageBookmarkRepository();
    expect(await repo.getAll()).toEqual([]);
    expect(store.dump()[BOOKMARKS_STORAGE_KEY]).toBe('no-json{{{');
  });
});
