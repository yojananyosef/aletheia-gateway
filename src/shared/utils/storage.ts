/**
 * Migración perezosa de claves de localStorage.
 *
 * En v0.11 el nombre del proyecto se corrigió de "Alethia" a "Aletheia"
 * y las claves `alethia_*` pasaron a `aletheia_*`. Para no borrar los
 * datos guardados por usuarios existentes (marcadores, resaltados,
 * notas, ajustes), la primera lectura cae al nombre legacy y lo
 * promueve a la clave nueva. Las claves legacy pueden eliminarse
 * en una versión major futura.
 */
export function readStorageWithLegacy(key: string, legacyKey: string | string[]): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const current = localStorage.getItem(key);
    if (current !== null) return current;
    const legacyKeys = Array.isArray(legacyKey) ? legacyKey : [legacyKey];
    for (const legacy of legacyKeys) {
      if (legacy === key) continue;
      const value = localStorage.getItem(legacy);
      if (value === null) continue;
      try {
        localStorage.setItem(key, value);
        localStorage.removeItem(legacy);
      } catch {
        // Almacenamiento lleno o bloqueado: se devuelve el valor legacy sin migrar.
      }
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export function removeStorageWithLegacy(key: string, legacyKey: string | string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
    const legacyKeys = Array.isArray(legacyKey) ? legacyKey : [legacyKey];
    for (const legacy of legacyKeys) {
      if (legacy !== key) localStorage.removeItem(legacy);
    }
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
}
