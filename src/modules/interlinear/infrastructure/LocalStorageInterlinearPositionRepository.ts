import type { InterlinearPosition } from '../domain/navigation';

/** Clave canónica: la usa el backup/reset de settings (no duplicar el literal). */
export const INTERLINEAR_POSITION_STORAGE_KEY = 'aletheia_interlinear_position';

function isPosition(value: unknown): value is InterlinearPosition {
  if (typeof value !== 'object' || value === null) return false;
  const { book, chapter, verse } = value as Partial<InterlinearPosition>;
  return (
    typeof book === 'string' &&
    book.trim().length > 0 &&
    Number.isInteger(chapter) &&
    (chapter as number) > 0 &&
    Number.isInteger(verse) &&
    (verse as number) > 0
  );
}

/**
 * Guarda dónde quedó el usuario en el interlineal para reabrirlo en el mismo
 * pasaje. Es una preferencia de navegación, no un dato de biblioteca: no se
 * valida contra los libros porque `loadChapter()` ya cae en un estado de error
 * claro si el pasaje guardado no existe.
 */
export class LocalStorageInterlinearPositionRepository {
  public get(): InterlinearPosition | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(INTERLINEAR_POSITION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isPosition(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  public save(position: InterlinearPosition): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(INTERLINEAR_POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch (err) {
      console.error('Error saving interlinear position:', err);
    }
  }

  public clear(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(INTERLINEAR_POSITION_STORAGE_KEY);
    } catch {
      // Almacenamiento bloqueado: se ignora.
    }
  }
}
