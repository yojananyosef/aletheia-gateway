import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERSONAL_NOTES_STORAGE_KEY, LocalStorageNoteRepository } from './LocalStorageNoteRepository';
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
    verseNumber: 1,
    translationId: 'RV1909',
    selectedText: 'En el principio',
    content: 'Reflexión personal',
  };
}

describe('LocalStorageNoteRepository', () => {
  it('guarda notas con id y timestamps', async () => {
    const repo = new LocalStorageNoteRepository();
    const saved = await repo.save(payload());
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.updatedAt).toBeTruthy();
    expect(await repo.getAll()).toHaveLength(1);
  });

  it('actualiza una nota existente por id sin duplicar', async () => {
    const repo = new LocalStorageNoteRepository();
    const saved = await repo.save(payload());
    const updated = await repo.save({ ...payload(), id: saved.id, content: 'Editada' });
    expect(updated.id).toBe(saved.id);
    expect(updated.content).toBe('Editada');
    expect(await repo.getAll()).toHaveLength(1);
  });

  it('filtra por capítulo y referencia sin importar mayúsculas', async () => {
    const repo = new LocalStorageNoteRepository();
    await repo.save(payload());
    await repo.save({ ...payload(), reference: 'Éxodo 2:1', book: 'Éxodo', chapter: 2, content: 'Otra' });
    expect(await repo.getByChapter('génesis', 1)).toHaveLength(1);
    expect(await repo.getByChapter('Génesis', 2)).toHaveLength(0);
    expect(await repo.getByReference('GÉNESIS 1:1')).toHaveLength(1);
  });

  it('elimina por id y tolera JSON corrupto', async () => {
    const repo = new LocalStorageNoteRepository();
    const saved = await repo.save(payload());
    await repo.remove(saved.id);
    expect(await repo.getAll()).toHaveLength(0);
    installMemoryStorage({ [PERSONAL_NOTES_STORAGE_KEY]: 'roto{{{' });
    expect(await repo.getAll()).toEqual([]);
  });
});
